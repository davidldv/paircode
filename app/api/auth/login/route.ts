import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { mintCsrfToken } from "@/lib/auth/csrf";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { issueSessionTokens } from "@/lib/auth/refresh";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { loginSchema, normalizeEmail } from "@/lib/auth/validation";
import { logSecurityEvent } from "@/lib/logging/logger";
import { RATE_LIMITS, consumeToken } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const MAX_FAILED_LOGINS = 10;
const LOCK_MINUTES = 15;

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipHash = hashIp(ip);
  const ua = request.headers.get("user-agent") ?? "";

  const ipLimit = consumeToken(`login:ip:${ipHash}`, RATE_LIMITS.loginPerIp);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const emailNormalized = normalizeEmail(email);

  const acctLimit = consumeToken(`login:acct:${emailNormalized}`, RATE_LIMITS.loginPerAccount);
  if (!acctLimit.allowed) {
    await logSecurityEvent({
      kind: "auth.login.rate_limited",
      severity: "warn",
      ipHash,
      metadata: { emailNormalized, ua },
    });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { emailNormalized },
    select: {
      id: true,
      passwordHash: true,
      lockedUntil: true,
      failedLoginCount: true,
      displayName: true,
      email: true,
    },
  });

  if (!user) {
    await logSecurityEvent({
      kind: "auth.login.failed",
      severity: "warn",
      ipHash,
      metadata: { reason: "no_such_user", emailNormalized, ua },
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logSecurityEvent({
      kind: "auth.login.locked",
      severity: "warn",
      userId: user.id,
      ipHash,
      metadata: { until: user.lockedUntil.toISOString(), ua },
    });
    return NextResponse.json({ error: "account_locked" }, { status: 423 });
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    const nextFailed = user.failedLoginCount + 1;
    const shouldLock = nextFailed >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextFailed,
        ...(shouldLock
          ? { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000), failedLoginCount: 0 }
          : {}),
      },
    });
    await logSecurityEvent({
      kind: shouldLock ? "auth.login.locked" : "auth.login.failed",
      severity: shouldLock ? "crit" : "warn",
      userId: user.id,
      ipHash,
      metadata: { reason: "bad_password", ua },
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null },
  });

  const tokens = await issueSessionTokens(user.id, { ipHash, userAgent: ua });
  const csrfToken = mintCsrfToken();

  const response = NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  setAuthCookies(response, {
    accessJwt: tokens.accessJwt,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
    csrfToken,
  });

  await logSecurityEvent({
    kind: "auth.login.success",
    severity: "info",
    userId: user.id,
    sessionId: tokens.sessionId,
    ipHash,
    metadata: { ua },
  });

  return response;
}
