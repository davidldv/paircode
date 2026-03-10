import { prisma } from "./db.mjs";

const MAX_ROOM_MESSAGES = 150;
const ROOM_INVITE_TTL_DAYS = 7;

function serializeOwner(room) {
  if (!room.ownerAuthUserId || !room.ownerName) {
    return null;
  }

  return {
    authUserId: room.ownerAuthUserId,
    name: room.ownerName,
  };
}

function serializeInvite(invite) {
  if (!invite) {
    return null;
  }

  return {
    code: invite.code,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

function serializeMember(member) {
  return {
    authUserId: member.authUserId,
    name: member.name,
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

export async function ensureRoomRecord(roomId) {
  return prisma.room.upsert({
    where: { slug: roomId },
    update: {},
    create: { slug: roomId },
  });
}

export async function getRoomRecord(roomId) {
  return prisma.room.findUnique({
    where: { slug: roomId },
  });
}

export async function authorizeRoomJoin(roomId, user, inviteCode) {
  const existingRoom = await getRoomRecord(roomId);

  if (!existingRoom) {
    const room = await prisma.room.create({
      data: {
        slug: roomId,
        ownerAuthUserId: user.authUserId,
        ownerName: user.name,
        memberships: {
          create: {
            authUserId: user.authUserId,
            name: user.name,
          },
        },
      },
    });

    return {
      ok: true,
      room,
      createdRoom: true,
      joinedViaInvite: false,
    };
  }

  if (existingRoom.ownerAuthUserId === user.authUserId) {
    await prisma.roomMembership.upsert({
      where: {
        roomId_authUserId: {
          roomId: existingRoom.id,
          authUserId: user.authUserId,
        },
      },
      update: {
        name: user.name,
      },
      create: {
        roomId: existingRoom.id,
        authUserId: user.authUserId,
        name: user.name,
      },
    });

    return {
      ok: true,
      room: existingRoom,
      createdRoom: false,
      joinedViaInvite: false,
    };
  }

  const membership = await prisma.roomMembership.findUnique({
    where: {
      roomId_authUserId: {
        roomId: existingRoom.id,
        authUserId: user.authUserId,
      },
    },
  });

  if (membership) {
    if (membership.name !== user.name) {
      await prisma.roomMembership.update({
        where: { id: membership.id },
        data: { name: user.name },
      });
    }

    return {
      ok: true,
      room: existingRoom,
      createdRoom: false,
      joinedViaInvite: false,
    };
  }

  const trimmedInviteCode = String(inviteCode ?? "").trim().toUpperCase();
  if (!trimmedInviteCode) {
    return {
      ok: false,
      error: "This room is restricted. Ask the room owner for an invite link before joining.",
    };
  }

  const invite = await prisma.roomInvite.findFirst({
    where: {
      roomId: existingRoom.id,
      code: trimmedInviteCode,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!invite) {
    return {
      ok: false,
      error: "Invite link is invalid or expired for this room.",
    };
  }

  await prisma.roomMembership.create({
    data: {
      roomId: existingRoom.id,
      authUserId: user.authUserId,
      name: user.name,
    },
  });

  return {
    ok: true,
    room: existingRoom,
    createdRoom: false,
    joinedViaInvite: true,
  };
}

export async function getRoomSnapshot(roomId) {
  const room = await ensureRoomRecord(roomId);
  const messages = await prisma.roomMessage.findMany({
    where: { roomId: room.id },
    orderBy: { timestamp: "asc" },
    take: MAX_ROOM_MESSAGES,
  });
  const activeInvite = await prisma.roomInvite.findFirst({
    where: {
      roomId: room.id,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const memberships = await prisma.roomMembership.findMany({
    where: { roomId: room.id },
    orderBy: [
      { name: "asc" },
      { createdAt: "asc" },
    ],
  });

  return {
    roomId: room.slug,
    messages: messages.map(serializeMessage),
    owner: serializeOwner(room),
    members: memberships.map(serializeMember),
    activeInvite: serializeInvite(activeInvite),
    context: {
      selectedFiles: room.selectedFiles,
      pinnedRequirements: room.pinnedRequirements,
    },
  };
}

export async function canManageRoom(roomId, authUserId) {
  const room = await ensureRoomRecord(roomId);
  return room.ownerAuthUserId === authUserId;
}

export async function createRoomInvite(roomId, authUserId) {
  const room = await ensureRoomRecord(roomId);

  if (room.ownerAuthUserId !== authUserId) {
    throw new Error("Only the room owner can manage invite links.");
  }

  await prisma.roomInvite.updateMany({
    where: {
      roomId: room.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const invite = await prisma.roomInvite.create({
    data: {
      roomId: room.id,
      code: generateInviteCode(),
      createdByAuthUserId: authUserId,
      expiresAt: new Date(Date.now() + ROOM_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return serializeInvite(invite);
}

export async function removeRoomMember(roomId, ownerAuthUserId, memberAuthUserId) {
  const room = await ensureRoomRecord(roomId);

  if (room.ownerAuthUserId !== ownerAuthUserId) {
    throw new Error("Only the room owner can remove members.");
  }

  if (!memberAuthUserId || memberAuthUserId === room.ownerAuthUserId) {
    throw new Error("The room owner cannot be removed.");
  }

  await prisma.roomMembership.deleteMany({
    where: {
      roomId: room.id,
      authUserId: memberAuthUserId,
    },
  });

  const memberships = await prisma.roomMembership.findMany({
    where: { roomId: room.id },
    orderBy: [
      { name: "asc" },
      { createdAt: "asc" },
    ],
  });

  return memberships.map(serializeMember);
}

export async function createRoomMessage(roomId, message) {
  const room = await ensureRoomRecord(roomId);

  await prisma.roomMessage.create({
    data: {
      id: message.id,
      roomId: room.id,
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

  await trimRoomMessages(room.id);
}

export async function updateRoomMessage(roomId, messageId, patch) {
  const room = await ensureRoomRecord(roomId);

  await prisma.roomMessage.update({
    where: { id: messageId },
    data: {
      ...(patch.text !== undefined ? { text: patch.text } : {}),
      ...(patch.timestamp ? { timestamp: new Date(patch.timestamp) } : {}),
      ...(patch.mode !== undefined ? { mode: patch.mode ?? null } : {}),
      ...(patch.auditMetadata !== undefined ? { auditMetadata: patch.auditMetadata ?? undefined } : {}),
      ...(patch.isStreaming !== undefined ? { isStreaming: patch.isStreaming } : {}),
      roomId: room.id,
    },
  });
}

export async function updateRoomContext(roomId, context) {
  const room = await prisma.room.update({
    where: { slug: roomId },
    data: {
      selectedFiles: context.selectedFiles,
      pinnedRequirements: context.pinnedRequirements,
    },
  });

  return {
    selectedFiles: room.selectedFiles,
    pinnedRequirements: room.pinnedRequirements,
  };
}

async function trimRoomMessages(roomRecordId) {
  const messages = await prisma.roomMessage.findMany({
    where: { roomId: roomRecordId },
    orderBy: { timestamp: "desc" },
    skip: MAX_ROOM_MESSAGES,
    select: { id: true },
  });

  if (messages.length === 0) return;

  await prisma.roomMessage.deleteMany({
    where: {
      id: {
        in: messages.map((message) => message.id),
      },
    },
  });
}