import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { COOKIE_NAMES } from "@/lib/auth/env";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { hashOpaqueToken } from "@/lib/auth/jwt";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { logSecurityEvent } from "@/lib/logging/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers);
  const ipHash = hashIp(ip);

  const accessCookie = request.cookies.get(COOKIE_NAMES.access)?.value;
  const refreshCookie = request.cookies.get(COOKIE_NAMES.refresh)?.value;
  let userId: string | null = null;
  let sessionId: string | null = null;

  if (accessCookie) {
    try {
      const claims = await verifyAccessToken(accessCookie);
      userId = claims.sub;
      sessionId = claims.sid;
    } catch {
      // token invalid; continue to best-effort logout via refresh cookie
    }
  }

  if (!sessionId && refreshCookie) {
    const tokenHash = hashOpaqueToken(refreshCookie);
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { sessionId: true, session: { select: { userId: true } } },
    });
    if (token) {
      sessionId = token.sessionId;
      userId = token.session.userId;
    }
  }

  if (sessionId) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await logSecurityEvent({
      kind: "auth.logout",
      severity: "info",
      userId,
      sessionId,
      ipHash,
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
