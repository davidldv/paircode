import { NextResponse } from "next/server";

import { AuthError, requireUser } from "@/lib/auth/guard";
import { extractClientIp, hashIp } from "@/lib/auth/request";
import { logSecurityEvent } from "@/lib/logging/logger";
import { RATE_LIMITS, consumeToken } from "@/lib/security/rate-limit";
import { issueWsTicket } from "@/lib/security/ws-ticket";
import { headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId, sessionId } = await requireUser();
    const h = await nextHeaders();
    const ipHash = hashIp(extractClientIp(h));

    const limit = consumeToken(`wsTicket:user:${userId}`, RATE_LIMITS.wsTicketPerUser);
    if (!limit.allowed) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const ticket = await issueWsTicket({ userId, sessionId });
    await logSecurityEvent({
      kind: "ws.ticket.issued",
      severity: "info",
      userId,
      sessionId,
      ipHash,
    });
    return NextResponse.json({
      ticket: ticket.raw,
      expiresAt: ticket.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
