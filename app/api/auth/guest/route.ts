import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { mintCsrfToken } from "@/lib/auth/csrf";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { issueSessionTokens } from "@/lib/auth/refresh";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { normalizeEmail } from "@/lib/auth/validation";
import { logSecurityEvent } from "@/lib/logging/logger";
import { RATE_LIMITS, consumeToken } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipHash = hashIp(ip);
  const ua = request.headers.get("user-agent") ?? "";
  
  try {
    const limit = consumeToken(`guest:ip:${ipHash}`, RATE_LIMITS.signupPerIp);
    if (!limit.allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const randomSuffix = randomBytes(4).toString("hex");
    const email = `guest-${randomSuffix}@example.com`;
    const displayName = `Guest ${randomSuffix.toUpperCase()}`;
    const password = `GuestToken_${randomBytes(16).toString("base64")}_$1`;

    const emailNormalized = normalizeEmail(email);
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, emailNormalized, displayName, passwordHash },
      select: { id: true },
    });
    const userId = user.id;

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
      kind: "auth.guest_login.success",
      severity: "info",
      userId,
      sessionId: tokens.sessionId,
      ipHash,
      metadata: { ua, email },
    });

    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    const isAuthMisconfigured =
      reason.includes("invalid_jwt_") ||
      reason.toLowerCase().includes("pkcs8") ||
      reason.toLowerCase().includes("spki") ||
      reason.includes("Missing required environment variable: JWT_");

    await logSecurityEvent({
      kind: "auth.guest_login.error",
      severity: "crit",
      ipHash,
      metadata: {
        ua,
        reason,
      },
    });
    return NextResponse.json(
      { error: isAuthMisconfigured ? "auth_misconfigured" : "login_unavailable" },
      { status: isAuthMisconfigured ? 500 : 503 },
    );
  }
}

export async function GET() {
  const response = NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
  clearAuthCookies(response);
  return response;
}
