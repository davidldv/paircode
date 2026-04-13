import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { WS_TICKET_TTL_SECONDS } from "@/lib/auth/env";

export async function issueWsTicket(args: { userId: string; sessionId: string }) {
  const raw = randomBytes(24).toString("base64url");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + WS_TICKET_TTL_SECONDS * 1000);

  await prisma.wsTicket.create({
    data: {
      tokenHash,
      userId: args.userId,
      sessionId: args.sessionId,
      expiresAt,
    },
  });

  return { raw, expiresAt };
}

export async function redeemWsTicket(raw: string): Promise<{ userId: string; sessionId: string } | null> {
  const tokenHash = createHash("sha256").update(raw).digest("hex");

  try {
    const ticket = await prisma.wsTicket.delete({
      where: { tokenHash },
      select: { userId: true, sessionId: true, expiresAt: true },
    });
    if (ticket.expiresAt <= new Date()) return null;
    return { userId: ticket.userId, sessionId: ticket.sessionId };
  } catch {
    return null;
  }
}

export async function purgeExpiredWsTickets(): Promise<number> {
  const result = await prisma.wsTicket.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}
