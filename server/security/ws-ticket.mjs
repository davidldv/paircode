import { createHash } from "node:crypto";

import { prisma } from "../db.mjs";

export async function redeemWsTicket(raw) {
  if (!raw || typeof raw !== "string") return null;
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
