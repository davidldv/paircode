import { NextRequest, NextResponse } from "next/server";

import { mintCsrfToken } from "@/lib/auth/csrf";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { COOKIE_NAMES } from "@/lib/auth/env";
import { RefreshError, rotateRefreshToken } from "@/lib/auth/refresh";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { logSecurityEvent } from "@/lib/logging/logger";
import { RATE_LIMITS, consumeToken } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipHash = hashIp(ip);

  const limit = consumeToken(`refresh:ip:${ipHash}`, RATE_LIMITS.refreshPerIp);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const raw = request.cookies.get(COOKIE_NAMES.refresh)?.value;
  if (!raw) {
    return NextResponse.json({ error: "no_refresh_cookie" }, { status: 401 });
  }

  try {
    const result = await rotateRefreshToken(raw);
    const csrfToken = mintCsrfToken();
    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, {
      accessJwt: result.accessJwt,
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt,
      csrfToken,
    });
    await logSecurityEvent({
      kind: "auth.refresh.rotated",
      severity: "info",
      userId: result.userId,
      sessionId: result.sessionId,
      ipHash,
    });
    return response;
  } catch (error) {
    const response = NextResponse.json({ error: "refresh_failed" }, { status: 401 });
    clearAuthCookies(response);
    if (error instanceof RefreshError) {
      await logSecurityEvent({
        kind: `auth.refresh.${error.code}`,
        severity: error.code === "refresh_reuse" ? "crit" : "warn",
        ipHash,
      });
    } else {
      await logSecurityEvent({
        kind: "auth.refresh.error",
        severity: "warn",
        ipHash,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
    }
    return response;
  }
}
