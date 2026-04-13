import { headers } from "next/headers";

import { prisma } from "@/lib/db";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401,
  ) {
    super(message);
  }
}

export type Principal = {
  userId: string;
  sessionId: string;
};

export async function requireUser(): Promise<Principal> {
  const h = await headers();
  const userId = h.get("x-user-id");
  const sessionId = h.get("x-session-id");
  if (!userId || !sessionId) {
    throw new AuthError("unauth", 401);
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { revokedAt: true, userId: true },
  });
  if (!session || session.revokedAt || session.userId !== userId) {
    throw new AuthError("session_invalid", 401);
  }
  return { userId, sessionId };
}

export async function assertRoomRole(
  userId: string,
  roomSlug: string,
  allowed: ReadonlyArray<"owner" | "collaborator" | "viewer">,
) {
  const room = await prisma.room.findUnique({
    where: { slug: roomSlug },
    select: { id: true, ownerId: true },
  });
  if (!room) throw new AuthError("room_not_found", 404);

  if (room.ownerId === userId) {
    if (!allowed.includes("owner")) throw new AuthError("forbidden", 403);
    return { role: "owner" as const, roomId: room.id };
  }

  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
    select: { role: true },
  });
  if (!membership) throw new AuthError("not_a_member", 403);
  if (!allowed.includes(membership.role)) throw new AuthError("forbidden", 403);
  return { role: membership.role, roomId: room.id };
}
