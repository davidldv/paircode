import { prisma } from "../db.mjs";

export async function loadActiveSession(sessionId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      revokedAt: true,
      user: {
        select: { id: true, displayName: true, credentialVersion: true },
      },
    },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  return {
    sessionId: session.id,
    userId: session.user.id,
    displayName: session.user.displayName,
    credentialVersion: session.user.credentialVersion,
  };
}

export async function markSessionActivity(sessionId) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastSeenAt: new Date() },
  }).catch(() => undefined);
}
