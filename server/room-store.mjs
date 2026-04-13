import { prisma } from "./db.mjs";

const MAX_ROOM_MESSAGES = 150;
const ROOM_INVITE_TTL_DAYS = 7;

function serializeOwner(owner) {
  if (!owner) return null;
  return {
    userId: owner.id,
    name: owner.displayName,
  };
}

function serializeInvite(invite) {
  if (!invite) return null;
  return {
    code: invite.code,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

function serializeMember(member) {
  return {
    userId: member.userId,
    name: member.user?.displayName ?? "Unknown",
    role: member.role,
  };
}

function serializeMessage(message) {
  return {
    id: message.id,
    type: message.type,
    userId: message.userId,
    userName: message.userName,
    text: message.text,
    timestamp: message.timestamp.toISOString(),
    mode: message.mode ?? undefined,
    auditMetadata: message.auditMetadata ?? undefined,
    isStreaming: message.isStreaming,
  };
}

function generateInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

export async function ensureRoomRecord(slug) {
  return prisma.room.findUnique({ where: { slug } });
}

export async function authorizeRoomJoin(slug, user, inviteCode) {
  const trimmedInviteCode = String(inviteCode ?? "").trim().toUpperCase();

  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!existingRoom) {
    const created = await prisma.room.create({
      data: {
        slug,
        ownerId: user.userId,
        memberships: {
          create: {
            userId: user.userId,
            role: "owner",
          },
        },
      },
      select: { id: true, slug: true },
    });
    return {
      ok: true,
      roomId: created.id,
      roomSlug: created.slug,
      role: "owner",
      createdRoom: true,
      joinedViaInvite: false,
    };
  }

  if (existingRoom.ownerId === user.userId) {
    await prisma.roomMembership.upsert({
      where: { roomId_userId: { roomId: existingRoom.id, userId: user.userId } },
      update: { role: "owner" },
      create: { roomId: existingRoom.id, userId: user.userId, role: "owner" },
    });
    return {
      ok: true,
      roomId: existingRoom.id,
      roomSlug: slug,
      role: "owner",
      createdRoom: false,
      joinedViaInvite: false,
    };
  }

  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId: existingRoom.id, userId: user.userId } },
    select: { role: true },
  });
  if (membership) {
    return {
      ok: true,
      roomId: existingRoom.id,
      roomSlug: slug,
      role: membership.role,
      createdRoom: false,
      joinedViaInvite: false,
    };
  }

  if (!trimmedInviteCode) {
    return {
      ok: false,
      error: "This room is restricted. Ask the room owner for an invite link before joining.",
    };
  }

  const redeemedRole = await prisma.$transaction(async (tx) => {
    const invite = await tx.roomInvite.findFirst({
      where: {
        roomId: existingRoom.id,
        code: trimmedInviteCode,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!invite) return null;

    await tx.roomMembership.create({
      data: {
        roomId: existingRoom.id,
        userId: user.userId,
        role: "collaborator",
      },
    });
    return "collaborator";
  });

  if (!redeemedRole) {
    return { ok: false, error: "Invite link is invalid or expired for this room." };
  }

  return {
    ok: true,
    roomId: existingRoom.id,
    roomSlug: slug,
    role: redeemedRole,
    createdRoom: false,
    joinedViaInvite: true,
  };
}

export async function getRoomSnapshot(roomId) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      slug: true,
      selectedFiles: true,
      pinnedRequirements: true,
      owner: { select: { id: true, displayName: true } },
    },
  });
  if (!room) return null;

  const [messages, activeInvite, memberships] = await Promise.all([
    prisma.roomMessage.findMany({
      where: { roomId: room.id },
      orderBy: { timestamp: "asc" },
      take: MAX_ROOM_MESSAGES,
    }),
    prisma.roomInvite.findFirst({
      where: {
        roomId: room.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roomMembership.findMany({
      where: { roomId: room.id },
      select: {
        userId: true,
        role: true,
        user: { select: { displayName: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return {
    roomId: room.slug,
    roomRecordId: room.id,
    messages: messages.map(serializeMessage),
    owner: serializeOwner(room.owner),
    members: memberships.map(serializeMember),
    activeInvite: serializeInvite(activeInvite),
    context: {
      selectedFiles: room.selectedFiles,
      pinnedRequirements: room.pinnedRequirements,
    },
  };
}

export async function createRoomInvite(roomId, actorUserId) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });
  if (!room) throw new Error("Room not found.");
  if (room.ownerId !== actorUserId) {
    throw new Error("Only the room owner can manage invite links.");
  }

  await prisma.roomInvite.updateMany({
    where: { roomId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const invite = await prisma.roomInvite.create({
    data: {
      roomId,
      code: generateInviteCode(),
      createdById: actorUserId,
      expiresAt: new Date(Date.now() + ROOM_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return serializeInvite(invite);
}

export async function removeRoomMember(roomId, actorUserId, memberUserId) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });
  if (!room) throw new Error("Room not found.");
  if (room.ownerId !== actorUserId) {
    throw new Error("Only the room owner can remove members.");
  }
  if (!memberUserId || memberUserId === room.ownerId) {
    throw new Error("The room owner cannot be removed.");
  }

  await prisma.roomMembership.deleteMany({
    where: { roomId, userId: memberUserId },
  });

  const memberships = await prisma.roomMembership.findMany({
    where: { roomId },
    select: {
      userId: true,
      role: true,
      user: { select: { displayName: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return memberships.map(serializeMember);
}

export async function updateRoomMemberRole(roomId, actorUserId, memberUserId, role) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });
  if (!room) throw new Error("Room not found.");
  if (room.ownerId !== actorUserId) {
    throw new Error("Only the room owner can update member roles.");
  }
  if (!["collaborator", "viewer"].includes(role)) {
    throw new Error("Invalid role.");
  }
  if (memberUserId === room.ownerId) {
    throw new Error("The room owner role cannot be changed here.");
  }

  await prisma.roomMembership.update({
    where: { roomId_userId: { roomId, userId: memberUserId } },
    data: { role },
  });
}

export async function createRoomMessage(roomId, message) {
  await prisma.roomMessage.create({
    data: {
      id: message.id,
      roomId,
      type: message.type,
      userId: message.userId,
      userName: message.userName,
      text: message.text,
      timestamp: new Date(message.timestamp),
      mode: message.mode ?? null,
      auditMetadata: message.auditMetadata ?? undefined,
      isStreaming: message.isStreaming ?? false,
    },
  });
  await trimRoomMessages(roomId);
}

export async function updateRoomMessage(roomId, messageId, patch) {
  await prisma.roomMessage.update({
    where: { id: messageId },
    data: {
      ...(patch.text !== undefined ? { text: patch.text } : {}),
      ...(patch.timestamp ? { timestamp: new Date(patch.timestamp) } : {}),
      ...(patch.mode !== undefined ? { mode: patch.mode ?? null } : {}),
      ...(patch.auditMetadata !== undefined ? { auditMetadata: patch.auditMetadata ?? undefined } : {}),
      ...(patch.isStreaming !== undefined ? { isStreaming: patch.isStreaming } : {}),
      roomId,
    },
  });
}

export async function updateRoomContext(roomId, context) {
  const room = await prisma.room.update({
    where: { id: roomId },
    data: {
      selectedFiles: String(context.selectedFiles ?? ""),
      pinnedRequirements: String(context.pinnedRequirements ?? ""),
    },
    select: { selectedFiles: true, pinnedRequirements: true },
  });
  return {
    selectedFiles: room.selectedFiles,
    pinnedRequirements: room.pinnedRequirements,
  };
}

async function trimRoomMessages(roomId) {
  const overflow = await prisma.roomMessage.findMany({
    where: { roomId },
    orderBy: { timestamp: "desc" },
    skip: MAX_ROOM_MESSAGES,
    select: { id: true },
  });
  if (overflow.length === 0) return;
  await prisma.roomMessage.deleteMany({
    where: { id: { in: overflow.map((m) => m.id) } },
  });
}
