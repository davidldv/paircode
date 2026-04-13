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
    if (handler) handler();
  }

  async emitMessage(payload) {
    const handler = this.handlers.get("message");
    return handler?.(Buffer.from(JSON.stringify(payload)));
  }
}

export function createAccessTestStore() {
  const room = {
    recordId: "room-alpha",
    slug: "alpha-room",
    owner: { userId: "user-owner", name: "Owner" },
    members: [{ userId: "user-owner", name: "Owner", role: "owner" }],
    messages: [],
    activeInvite: { code: "INVITE123456", expiresAt: "2030-01-01T00:00:00.000Z" },
    context: { selectedFiles: "", pinnedRequirements: "" },
  };

  return {
    room,
    async authorizeRoomJoin(slug, user, inviteCode) {
      if (slug !== room.slug) {
        room.slug = slug;
        room.owner = { userId: user.userId, name: user.displayName };
        room.members = [{ userId: user.userId, name: user.displayName, role: "owner" }];
        return {
          ok: true,
          roomId: room.recordId,
          roomSlug: room.slug,
          role: "owner",
          createdRoom: true,
          joinedViaInvite: false,
        };
      }

      const existing = room.members.find((m) => m.userId === user.userId);
      if (existing) {
        return {
          ok: true,
          roomId: room.recordId,
          roomSlug: room.slug,
          role: existing.role,
          createdRoom: false,
          joinedViaInvite: false,
        };
      }

      if (String(inviteCode).trim().toUpperCase() === room.activeInvite.code) {
        room.members.push({ userId: user.userId, name: user.displayName, role: "collaborator" });
        return {
          ok: true,
          roomId: room.recordId,
          roomSlug: room.slug,
          role: "collaborator",
          createdRoom: false,
          joinedViaInvite: true,
        };
      }

      return {
        ok: false,
        error: "This room is restricted. Ask the room owner for an invite link before joining.",
      };
    },
    async createRoomInvite(roomId, actorUserId) {
      if (roomId !== room.recordId) throw new Error("Room not found.");
      if (actorUserId !== room.owner.userId) throw new Error("Only the room owner can rotate invite links.");
      room.activeInvite = {
        code: room.activeInvite.code === "INVITE123456" ? "ROTATED654321" : "INVITE123456",
        expiresAt: "2030-01-08T00:00:00.000Z",
      };
      return room.activeInvite;
    },
    async createRoomMessage(_roomId, message) {
      room.messages.push(message);
    },
    async getRoomSnapshot(roomId) {
      if (roomId !== room.recordId) return null;
      return {
        roomId: room.slug,
        roomRecordId: room.recordId,
        owner: { ...room.owner },
        members: room.members.map((m) => ({ ...m })),
        messages: [...room.messages],
        activeInvite: room.activeInvite,
        context: { ...room.context },
      };
    },
    async removeRoomMember(roomId, actorUserId, memberUserId) {
      if (roomId !== room.recordId || actorUserId !== room.owner.userId) {
        throw new Error("Only the room owner can remove members.");
      }
      if (memberUserId === room.owner.userId) throw new Error("The room owner cannot be removed.");
      room.members = room.members.filter((m) => m.userId !== memberUserId);
      return room.members.map((m) => ({ ...m }));
    },
    async updateRoomMemberRole(roomId, actorUserId, memberUserId, role) {
      if (roomId !== room.recordId || actorUserId !== room.owner.userId) {
        throw new Error("Only the room owner can update member roles.");
      }
      if (!["collaborator", "viewer"].includes(role)) throw new Error("Invalid role.");
      const target = room.members.find((m) => m.userId === memberUserId);
      if (!target) throw new Error("Member not found.");
      target.role = role;
    },
    async updateRoomContext(_roomId, context) {
      room.context = { ...context };
      return { ...room.context };
    },
    async updateRoomMessage(_roomId, messageId, patch) {
      room.messages = room.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m));
    },
  };
}

export function createInviteTokenForStore(store, secret = TEST_INVITE_SECRET) {
  return createSignedInviteToken(
    {
      roomId: store.room.slug,
      inviteCode: store.room.activeInvite.code,
      expiresAt: store.room.activeInvite.expiresAt,
    },
    secret,
  );
}

function createFakeSecurity(store) {
  const fakeSessions = new Map();
  return {
    fakeSessions,
    resolveRoomRole: async (userId, roomId) => {
      if (roomId !== store.room.recordId) return null;
      if (store.room.owner.userId === userId) return "owner";
      const member = store.room.members.find((m) => m.userId === userId);
      return member?.role ?? null;
    },
    invalidateRoomRole: () => undefined,
    invalidateAllRolesForRoom: () => undefined,
    loadActiveSession: async (sessionId) =>
      fakeSessions.get(sessionId) ?? null,
    markSessionActivity: async () => undefined,
    logSecurityEvent: async () => undefined,
  };
}

export function createTestHandler(store, secret = TEST_INVITE_SECRET) {
  const security = createFakeSecurity(store);
  const handler = createRoomConnectionHandler({
    store,
    inviteLinks: {
      createInviteToken: ({ roomId, inviteCode, expiresAt }) =>
        createSignedInviteToken({ roomId, inviteCode, expiresAt }, secret),
      verifyInviteToken: (token) => verifySignedInviteToken(token, secret),
    },
    security,
  });

  async function connect(socket, principal) {
    security.fakeSessions.set(principal.sessionId, {
      sessionId: principal.sessionId,
      userId: principal.userId,
      displayName: principal.displayName,
      credentialVersion: 1,
    });
    await handler(socket, principal);
  }

  return { handler, connect, security };
}

export function getSentMessages(socket, type) {
  return socket.sent.filter((payload) => payload.type === type);
}
