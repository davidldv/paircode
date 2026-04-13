import { prisma } from "../db.mjs";

const cache = new Map();
const TTL_MS = 10_000;

function cacheKey(userId, roomId) {
  return `${userId}:${roomId}`;
}

export async function resolveRoomRole(userId, roomId) {
  const key = cacheKey(userId, roomId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.role;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });
  if (!room) {
    cache.set(key, { role: null, at: Date.now() });
    return null;
  }

  if (room.ownerId === userId) {
    cache.set(key, { role: "owner", at: Date.now() });
    return "owner";
  }

  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { role: true },
  });
  const role = membership?.role ?? null;
  cache.set(key, { role, at: Date.now() });
  return role;
}

export function invalidateRoomRole(userId, roomId) {
  cache.delete(cacheKey(userId, roomId));
}

export function invalidateAllRolesForRoom(roomId) {
  for (const key of cache.keys()) {
    if (key.endsWith(`:${roomId}`)) cache.delete(key);
  }
}
