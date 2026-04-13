import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { mintCsrfToken } from "@/lib/auth/csrf";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { assertStrongPassword, hashPassword } from "@/lib/auth/password";
import { issueSessionTokens } from "@/lib/auth/refresh";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { normalizeEmail, signupSchema } from "@/lib/auth/validation";
import { logSecurityEvent } from "@/lib/logging/logger";
import { RATE_LIMITS, consumeToken } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipHash = hashIp(ip);
  const ua = request.headers.get("user-agent") ?? "";

  const limit = consumeToken(`signup:ip:${ipHash}`, RATE_LIMITS.signupPerIp);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { email, displayName, password } = parsed.data;

  try {
    assertStrongPassword(password);
  } catch (error) {
    return NextResponse.json(
      { error: "weak_password", detail: error instanceof Error ? error.message : "invalid" },
      { status: 400 },
    );
  }

  const emailNormalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: { email, emailNormalized, displayName, passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await logSecurityEvent({
        kind: "auth.signup.duplicate_email",
        severity: "warn",
        ipHash,
        metadata: { ua },
      });
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    throw error;
  }

  const tokens = await issueSessionTokens(userId, { ipHash, userAgent: ua });
  const csrfToken = mintCsrfToken();

  const response = NextResponse.json({ id: userId, email, displayName });
  setAuthCookies(response, {
    accessJwt: tokens.accessJwt,
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
    csrfToken,
  });

  await logSecurityEvent({
    kind: "auth.signup.success",
    severity: "info",
    userId,
    sessionId: tokens.sessionId,
    ipHash,
    metadata: { ua },
  });

  return response;
}

export async function GET() {
  const response = NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
  clearAuthCookies(response);
  return response;
}
