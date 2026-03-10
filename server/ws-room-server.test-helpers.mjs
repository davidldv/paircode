import { createRoomConnectionHandler } from "./ws-room-server.mjs";
import { createSignedInviteToken, verifySignedInviteToken } from "./invite-link.mjs";

export const TEST_INVITE_SECRET = "test-invite-secret";

export class FakeSocket {
  OPEN = 1;

  constructor() {
    this.readyState = this.OPEN;
    this.handlers = new Map();
    this.sent = [];
    this.closed = false;
    this.meta = null;
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.readyState = 3;
    const handler = this.handlers.get("close");
    if (handler) {
      handler();
    }
  }

  async emitMessage(payload) {
    const handler = this.handlers.get("message");
    return handler?.(Buffer.from(JSON.stringify(payload)));
  }
}

export function createAccessTestStore() {
  const room = {
    roomId: "alpha-room",
    owner: { authUserId: "owner-1", name: "Owner" },
    members: [{ authUserId: "owner-1", name: "Owner" }],
    messages: [],
    activeInvite: { code: "INVITE123456", expiresAt: "2030-01-01T00:00:00.000Z" },
    context: {
      selectedFiles: "",
      pinnedRequirements: "",
    },
  };

  return {
    room,
    async authorizeRoomJoin(roomId, user, inviteCode) {
      if (roomId !== room.roomId) {
        room.roomId = roomId;
        room.owner = { authUserId: user.authUserId, name: user.name };
        room.members = [{ authUserId: user.authUserId, name: user.name }];
        return { ok: true, room, createdRoom: true, joinedViaInvite: false };
      }

      if (user.authUserId === room.owner.authUserId || room.members.some((member) => member.authUserId === user.authUserId)) {
        if (!room.members.some((member) => member.authUserId === user.authUserId)) {
          room.members.push({ authUserId: user.authUserId, name: user.name });
        }
        return { ok: true, room, createdRoom: false, joinedViaInvite: false };
      }

      if (String(inviteCode).trim().toUpperCase() === room.activeInvite.code) {
        room.members.push({ authUserId: user.authUserId, name: user.name });
        return { ok: true, room, createdRoom: false, joinedViaInvite: true };
      }

      return { ok: false, error: "This room is restricted. Ask the room owner for an invite link before joining." };
    },
    async canManageRoom(roomId, authUserId) {
      return roomId === room.roomId && authUserId === room.owner.authUserId;
    },
    async createRoomInvite() {
      room.activeInvite = {
        code: room.activeInvite.code === "INVITE123456" ? "ROTATED654321" : "INVITE123456",
        expiresAt: "2030-01-08T00:00:00.000Z",
      };
      return room.activeInvite;
    },
    async createRoomMessage(roomId, message) {
      room.messages.push(message);
    },
    async getRoomSnapshot(roomId) {
      if (roomId !== room.roomId) {
        return {
          roomId,
          owner: null,
          members: [],
          messages: [],
          activeInvite: null,
          context: room.context,
        };
      }

      return {
        roomId: room.roomId,
        owner: room.owner,
        members: [...room.members],
        messages: [...room.messages],
        activeInvite: room.activeInvite,
        context: { ...room.context },
      };
    },
    async removeRoomMember(roomId, ownerAuthUserId, memberAuthUserId) {
      if (roomId !== room.roomId || ownerAuthUserId !== room.owner.authUserId) {
        throw new Error("Only the room owner can remove members.");
      }

      if (memberAuthUserId === room.owner.authUserId) {
        throw new Error("The room owner cannot be removed.");
      }

      room.members = room.members.filter((member) => member.authUserId !== memberAuthUserId);
      return [...room.members];
    },
    async updateRoomContext(roomId, context) {
      room.context = { ...context };
      return { ...room.context };
    },
    async updateRoomMessage(roomId, messageId, patch) {
      room.messages = room.messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message));
    },
  };
}

export function createInviteTokenForStore(store, secret = TEST_INVITE_SECRET) {
  return createSignedInviteToken({
    roomId: store.room.roomId,
    inviteCode: store.room.activeInvite.code,
    expiresAt: store.room.activeInvite.expiresAt,
  }, secret);
}

export function createTestHandler(store, secret = TEST_INVITE_SECRET) {
  return createRoomConnectionHandler({
    verifySessionToken: async (token) => ({ sub: token }),
    store,
    inviteLinks: {
      createInviteToken: ({ roomId, inviteCode, expiresAt }) => createSignedInviteToken({ roomId, inviteCode, expiresAt }, secret),
      verifyInviteToken: (token) => verifySignedInviteToken(token, secret),
    },
  });
}

export function getSentMessages(socket, type) {
  return socket.sent.filter((payload) => payload.type === type);
}