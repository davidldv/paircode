import {
  buildAgentPrompt as defaultBuildAgentPrompt,
  buildFallbackResponse as defaultBuildFallbackResponse,
} from "./agent-utils.mjs";
import { canPerform } from "./security/rbac.mjs";
import { eventSchemas, joinSchema } from "./security/schemas.mjs";
import { consumeToken, RATE_LIMITS } from "./security/rate-limit.mjs";
import { logSecurityEvent as defaultLogSecurityEvent } from "./security/logger.mjs";
import {
  resolveRoomRole as defaultResolveRoomRole,
  invalidateRoomRole as defaultInvalidateRoomRole,
  invalidateAllRolesForRoom as defaultInvalidateAllRolesForRoom,
} from "./security/room-access.mjs";
import {
  loadActiveSession as defaultLoadActiveSession,
  markSessionActivity as defaultMarkSessionActivity,
} from "./security/session.mjs";

const SESSION_REVALIDATE_MS = 60_000;
const SESSION_ACTIVITY_MS = 60_000;
const MAX_FRAME_BYTES = 64 * 1024;

const RATE_KEY_BY_EVENT = {
  chat: { limit: RATE_LIMITS.wsChatPerUser, scope: "user" },
  typing: { limit: RATE_LIMITS.wsTypingPerUser, scope: "user" },
  "context:update": { limit: RATE_LIMITS.wsContextPerUser, scope: "user" },
  "ai:ask": { limit: RATE_LIMITS.wsAiAskPerUser, scope: "user" },
  "invite:create": { limit: RATE_LIMITS.wsInvitePerUser, scope: "user" },
  "membership:remove": { limit: RATE_LIMITS.wsMembershipPerUser, scope: "user" },
  "membership:update": { limit: RATE_LIMITS.wsMembershipPerUser, scope: "user" },
};

export function createRoomConnectionHandler({
  store,
  ai = {},
  inviteLinks = {},
  security = {},
}) {
  const rooms = new Map();
  const buildAgentPrompt = ai.buildAgentPrompt ?? defaultBuildAgentPrompt;
  const buildFallbackResponse = ai.buildFallbackResponse ?? defaultBuildFallbackResponse;
  const streamResponse = ai.streamResponse;
  const createInviteToken = inviteLinks.createInviteToken ?? (() => null);
  const verifyInviteToken = inviteLinks.verifyInviteToken ?? (() => null);

  const resolveRoomRole = security.resolveRoomRole ?? defaultResolveRoomRole;
  const invalidateRoomRole = security.invalidateRoomRole ?? defaultInvalidateRoomRole;
  const invalidateAllRolesForRoom = security.invalidateAllRolesForRoom ?? defaultInvalidateAllRolesForRoom;
  const loadActiveSession = security.loadActiveSession ?? defaultLoadActiveSession;
  const markSessionActivity = security.markSessionActivity ?? defaultMarkSessionActivity;
  const logSecurityEvent = security.logSecurityEvent ?? defaultLogSecurityEvent;

  function ensureRoomState(roomRecordId) {
    if (!rooms.has(roomRecordId)) {
      rooms.set(roomRecordId, {
        clients: new Map(),
        activeAgentRun: null,
      });
    }
    return rooms.get(roomRecordId);
  }

  function safeSend(client, payload) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }

  function broadcast(roomRecordId, payload, options = {}) {
    const roomState = rooms.get(roomRecordId);
    if (!roomState) return;
    const { exclude } = options;
    for (const [socketId, client] of roomState.clients.entries()) {
      if (exclude && socketId === exclude) continue;
      safeSend(client, payload);
    }
  }

  function serializeUser(socketId, client) {
    return {
      id: socketId,
      name: client.meta?.name ?? "Anonymous",
      userId: client.meta?.userId ?? undefined,
    };
  }

  async function serializeRoom(roomRecordId, roomSlug) {
    const roomSnapshot = await store.getRoomSnapshot(roomRecordId);
    if (!roomSnapshot) return null;
    const roomState = rooms.get(roomRecordId);
    const inviteToken = roomSnapshot.activeInvite
      ? createInviteToken({
          roomId: roomSlug,
          inviteCode: roomSnapshot.activeInvite.code,
          expiresAt: roomSnapshot.activeInvite.expiresAt,
        })
      : null;

    return {
      users: roomState
        ? [...roomState.clients.entries()].map(([id, client]) => serializeUser(id, client))
        : [],
      messages: roomSnapshot.messages,
      owner: roomSnapshot.owner,
      members: roomSnapshot.members,
      activeInvite: roomSnapshot.activeInvite && inviteToken
        ? { token: inviteToken, expiresAt: roomSnapshot.activeInvite.expiresAt }
        : null,
      context: roomSnapshot.context,
    };
  }

  async function publishAuditMessage(roomRecordId, roomSlug, auditMetadata, text) {
    const message = {
      id: crypto.randomUUID(),
      type: "system",
      userId: "room-audit",
      userName: "Room Audit",
      text,
      timestamp: new Date().toISOString(),
      auditMetadata,
    };
    await store.createRoomMessage(roomRecordId, message);
    broadcast(roomRecordId, { type: "chat", roomId: roomSlug, message });
  }

  function disconnectMemberSockets(roomRecordId, memberUserId, reason) {
    const roomState = rooms.get(roomRecordId);
    if (!roomState) return;
    for (const client of roomState.clients.values()) {
      if (client.meta?.userId !== memberUserId) continue;
      safeSend(client, { type: "error", error: reason });
      try {
        client.close(4003, "access_revoked");
      } catch {
        /* ignore */
      }
    }
  }

  async function runRoomAgent({ roomRecordId, roomSlug, requesterSocketId, requesterUserId, mode, question }) {
    const roomState = ensureRoomState(roomRecordId);
    const runId = crypto.randomUUID();
    roomState.activeAgentRun = runId;

    const roomSnapshot = await serializeRoom(roomRecordId, roomSlug);
    const prompt = buildAgentPrompt({ mode, question, roomSnapshot });
    const startedAt = new Date().toISOString();

    await store.createRoomMessage(roomRecordId, {
      id: runId,
      type: "ai",
      userId: "room-agent",
      userName: "Room Agent",
      text: "",
      timestamp: startedAt,
      mode,
      isStreaming: true,
    });

    broadcast(roomRecordId, {
      type: "ai:start",
      roomId: roomSlug,
      runId,
      mode,
      by: requesterSocketId,
      startedAt,
    });

    let fullText = "";

    try {
      if (streamResponse) {
        for await (const token of streamResponse(prompt)) {
          if (roomState.activeAgentRun !== runId) break;
          fullText += token;
          broadcast(roomRecordId, { type: "ai:chunk", roomId: roomSlug, runId, token });
        }
      } else {
        const fallback = buildFallbackResponse(mode, roomSnapshot, question);
        for (const token of fallback.split(/(\s+)/).filter(Boolean)) {
          if (roomState.activeAgentRun !== runId) break;
          fullText += token;
          broadcast(roomRecordId, { type: "ai:chunk", roomId: roomSlug, runId, token });
        }
      }

      const message = {
        id: runId,
        type: "ai",
        userId: "room-agent",
        userName: "Room Agent",
        text: fullText,
        timestamp: new Date().toISOString(),
        mode,
        isStreaming: false,
      };

      await store.updateRoomMessage(roomRecordId, runId, {
        text: message.text,
        timestamp: message.timestamp,
        mode,
        isStreaming: false,
      });

      roomState.activeAgentRun = null;
      broadcast(roomRecordId, { type: "ai:done", roomId: roomSlug, runId, message });
    } catch (error) {
      roomState.activeAgentRun = null;
      const detail = error instanceof Error ? error.message : "Unknown AI error";
      await store.updateRoomMessage(roomRecordId, runId, {
        text: fullText || "Agent run failed.",
        mode,
        isStreaming: false,
      }).catch(() => undefined);
      broadcast(roomRecordId, { type: "ai:error", roomId: roomSlug, runId, error: detail });
      await logSecurityEvent({
        kind: "ws.ai.failed",
        severity: "warn",
        userId: requesterUserId,
        roomId: roomRecordId,
        metadata: { reason: detail },
      });
    }
  }

  function leaveRoom(socketId, ws) {
    const roomRecordId = ws.meta?.roomRecordId;
    const roomSlug = ws.meta?.roomSlug;
    if (!roomRecordId) return;

    const roomState = rooms.get(roomRecordId);
    if (!roomState) return;

    const user = serializeUser(socketId, ws);
    roomState.clients.delete(socketId);
    ws.meta.roomRecordId = null;
    ws.meta.roomSlug = null;

    broadcast(roomRecordId, {
      type: "presence",
      roomId: roomSlug,
      event: "leave",
      user,
      users: [...roomState.clients.entries()].map(([id, client]) => serializeUser(id, client)),
    });

    if (roomState.clients.size === 0) {
      rooms.delete(roomRecordId);
    }
  }

  async function authorizeEvent(ws, eventType) {
    const action = RATE_KEY_BY_EVENT[eventType];
    if (action) {
      const rl = consumeToken(`ws:${eventType}:${ws.meta.userId}`, action.limit);
      if (!rl.allowed) {
        safeSend(ws, { type: "error", error: "Rate limit exceeded for this action." });
        await logSecurityEvent({
          kind: "ws.rate_limited",
          severity: "warn",
          userId: ws.meta.userId,
          sessionId: ws.meta.sessionId,
          roomId: ws.meta.roomRecordId,
          metadata: { event: eventType, retryAfterMs: rl.retryAfterMs },
        });
        return false;
      }
    }

    const role = await resolveRoomRole(ws.meta.userId, ws.meta.roomRecordId);
    if (!role) {
      safeSend(ws, { type: "error", error: "You no longer have access to this room." });
      try {
        ws.close(4003, "access_revoked");
      } catch {
        /* ignore */
      }
      return false;
    }
    ws.meta.role = role;

    if (!canPerform(role, eventType)) {
      safeSend(ws, { type: "error", error: "You do not have permission to perform this action." });
      await logSecurityEvent({
        kind: "ws.authz.denied",
        severity: "warn",
        userId: ws.meta.userId,
        sessionId: ws.meta.sessionId,
        roomId: ws.meta.roomRecordId,
        metadata: { event: eventType, role },
      });
      return false;
    }
    return true;
  }

  async function revalidateSessionIfNeeded(ws) {
    const now = Date.now();
    if (now - ws.meta.lastSessionCheckAt < SESSION_REVALIDATE_MS) return true;
    const session = await loadActiveSession(ws.meta.sessionId);
    if (!session || session.userId !== ws.meta.userId) {
      safeSend(ws, { type: "error", error: "Your session has ended. Please sign in again." });
      try {
        ws.close(4001, "session_revoked");
      } catch {
        /* ignore */
      }
      return false;
    }
    ws.meta.lastSessionCheckAt = now;
    if (now - ws.meta.lastActivityMarkAt > SESSION_ACTIVITY_MS) {
      ws.meta.lastActivityMarkAt = now;
      markSessionActivity(ws.meta.sessionId).catch(() => undefined);
    }
    return true;
  }

  return async function handleConnection(ws, principal) {
    const socketId = crypto.randomUUID();
    const now = Date.now();
    ws.meta = {
      id: socketId,
      userId: principal.userId,
      sessionId: principal.sessionId,
      name: principal.displayName,
      roomRecordId: null,
      roomSlug: null,
      role: null,
      lastSessionCheckAt: now,
      lastActivityMarkAt: now,
    };

    safeSend(ws, { type: "connected", socketId, now: new Date().toISOString() });

    ws.on("message", async (raw) => {
      if (raw.length > MAX_FRAME_BYTES) {
        safeSend(ws, { type: "error", error: "Payload too large." });
        try { ws.close(1009, "message_too_large"); } catch { /* ignore */ }
        return;
      }

      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        safeSend(ws, { type: "error", error: "Invalid JSON payload." });
        return;
      }

      if (typeof payload?.type !== "string") {
        safeSend(ws, { type: "error", error: "Event type is required." });
        return;
      }

      if (!(await revalidateSessionIfNeeded(ws))) return;

      if (payload.type === "join") {
        const parsed = joinSchema.safeParse(payload);
        if (!parsed.success) {
          safeSend(ws, { type: "error", error: "Invalid join payload." });
          return;
        }

        let slug = parsed.data.roomId;
        const inviteToken = parsed.data.inviteToken ?? "";
        const displayName = parsed.data.userName ?? principal.displayName;
        let inviteCode = "";

        if (inviteToken) {
          const verifiedInvite = verifyInviteToken(inviteToken);
          if (!verifiedInvite) {
            safeSend(ws, { type: "error", error: "Invite link is invalid or expired for this room." });
            return;
          }
          if (slug && slug !== verifiedInvite.roomId) {
            safeSend(ws, { type: "error", error: "Invite link does not match the selected room." });
            return;
          }
          slug = verifiedInvite.roomId;
          inviteCode = verifiedInvite.inviteCode;
        }

        if (ws.meta.roomRecordId) leaveRoom(socketId, ws);

        const joinResult = await store.authorizeRoomJoin(
          slug,
          { userId: ws.meta.userId, displayName },
          inviteCode,
        );

        if (!joinResult.ok) {
          safeSend(ws, { type: "error", error: joinResult.error });
          await logSecurityEvent({
            kind: "ws.room.join.denied",
            severity: "warn",
            userId: ws.meta.userId,
            sessionId: ws.meta.sessionId,
            metadata: { roomSlug: slug, reason: joinResult.error },
          });
          return;
        }

        invalidateRoomRole(ws.meta.userId, joinResult.roomId);

        const roomState = ensureRoomState(joinResult.roomId);
        ws.meta.roomRecordId = joinResult.roomId;
        ws.meta.roomSlug = joinResult.roomSlug;
        ws.meta.name = displayName;
        ws.meta.role = joinResult.role;
        roomState.clients.set(socketId, ws);

        const snapshot = await serializeRoom(joinResult.roomId, joinResult.roomSlug);
        const canManageRoom = joinResult.role === "owner";
        safeSend(ws, {
          type: "room:snapshot",
          roomId: joinResult.roomSlug,
          ...snapshot,
          permissions: { canManageRoom, role: joinResult.role },
          activeInvite: canManageRoom ? snapshot.activeInvite : null,
        });

        broadcast(joinResult.roomId, {
          type: "presence",
          roomId: joinResult.roomSlug,
          event: "join",
          user: serializeUser(socketId, ws),
          users: snapshot.users,
        }, { exclude: socketId });

        await logSecurityEvent({
          kind: "ws.room.joined",
          userId: ws.meta.userId,
          sessionId: ws.meta.sessionId,
          roomId: joinResult.roomId,
          metadata: { role: joinResult.role, createdRoom: joinResult.createdRoom, joinedViaInvite: joinResult.joinedViaInvite },
        });

        if (joinResult.createdRoom) {
          await publishAuditMessage(joinResult.roomId, joinResult.roomSlug, {
            kind: "room-created",
            actorName: displayName,
            actorUserId: ws.meta.userId,
          }, `${displayName} created this room and became its owner.`);
        } else if (joinResult.joinedViaInvite) {
          await publishAuditMessage(joinResult.roomId, joinResult.roomSlug, {
            kind: "member-added",
            actorName: displayName,
            actorUserId: ws.meta.userId,
            targetName: displayName,
            targetUserId: ws.meta.userId,
          }, `${displayName} joined through an invite link and was added to the room access list.`);
        }
        return;
      }

      if (!ws.meta.roomRecordId) {
        safeSend(ws, { type: "error", error: "Join a room before sending events." });
        return;
      }

      const schema = eventSchemas[payload.type];
      if (!schema) {
        safeSend(ws, { type: "error", error: `Unknown event type: ${String(payload.type)}` });
        return;
      }

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        safeSend(ws, { type: "error", error: "Invalid event payload." });
        await logSecurityEvent({
          kind: "ws.validation.failed",
          severity: "warn",
          userId: ws.meta.userId,
          sessionId: ws.meta.sessionId,
          roomId: ws.meta.roomRecordId,
          metadata: { event: payload.type },
        });
        return;
      }
      const event = parsed.data;

      if (!(await authorizeEvent(ws, event.type))) return;

      const roomRecordId = ws.meta.roomRecordId;
      const roomSlug = ws.meta.roomSlug;

      if (event.type === "chat") {
        const message = {
          id: crypto.randomUUID(),
          type: "chat",
          userId: ws.meta.userId,
          userName: ws.meta.name,
          text: event.text,
          timestamp: new Date().toISOString(),
        };
        await store.createRoomMessage(roomRecordId, message);
        broadcast(roomRecordId, { type: "chat", roomId: roomSlug, message });
        return;
      }

      if (event.type === "typing") {
        broadcast(roomRecordId, {
          type: "typing",
          roomId: roomSlug,
          user: serializeUser(socketId, ws),
          isTyping: event.isTyping,
        }, { exclude: socketId });
        return;
      }

      if (event.type === "context:update") {
        const context = await store.updateRoomContext(roomRecordId, event.context);
        broadcast(roomRecordId, {
          type: "context",
          roomId: roomSlug,
          context,
          updatedBy: serializeUser(socketId, ws),
        });
        return;
      }

      if (event.type === "ai:ask") {
        runRoomAgent({
          roomRecordId,
          roomSlug,
          requesterSocketId: socketId,
          requesterUserId: ws.meta.userId,
          mode: event.mode,
          question: event.question,
        });
        return;
      }

      if (event.type === "invite:create") {
        try {
          const invite = await store.createRoomInvite(roomRecordId, ws.meta.userId);
          const inviteToken = invite
            ? createInviteToken({ roomId: roomSlug, inviteCode: invite.code, expiresAt: invite.expiresAt })
            : null;
          if (!invite || !inviteToken) {
            throw new Error("Invite link signing is not configured on the realtime server.");
          }
          safeSend(ws, {
            type: "invite:created",
            roomId: roomSlug,
            invite: { token: inviteToken, expiresAt: invite.expiresAt },
          });
          await publishAuditMessage(roomRecordId, roomSlug, {
            kind: "invite-rotated",
            actorName: ws.meta.name,
            actorUserId: ws.meta.userId,
          }, `${ws.meta.name} rotated the room invite link.`);
          await logSecurityEvent({
            kind: "ws.invite.created",
            userId: ws.meta.userId,
            sessionId: ws.meta.sessionId,
            roomId: roomRecordId,
          });
        } catch (error) {
          safeSend(ws, {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to create an invite link.",
          });
        }
        return;
      }

      if (event.type === "membership:remove") {
        const memberUserId = event.memberUserId;
        try {
          const currentSnapshot = await store.getRoomSnapshot(roomRecordId);
          const targetMember = currentSnapshot?.members.find((m) => m.userId === memberUserId);
          const members = await store.removeRoomMember(roomRecordId, ws.meta.userId, memberUserId);
          invalidateRoomRole(memberUserId, roomRecordId);
          disconnectMemberSockets(roomRecordId, memberUserId, "Your access to this room was revoked by the room owner.");
          broadcast(roomRecordId, { type: "room:members", roomId: roomSlug, members });
          await publishAuditMessage(roomRecordId, roomSlug, {
            kind: "member-removed",
            actorName: ws.meta.name,
            actorUserId: ws.meta.userId,
            targetName: targetMember?.name,
            targetUserId: memberUserId,
          }, `${ws.meta.name} removed ${targetMember?.name ?? "a member"} from the room access list.`);
          await logSecurityEvent({
            kind: "ws.membership.removed",
            userId: ws.meta.userId,
            sessionId: ws.meta.sessionId,
            roomId: roomRecordId,
            metadata: { targetUserId: memberUserId },
          });
        } catch (error) {
          safeSend(ws, {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to remove room member.",
          });
        }
        return;
      }

      if (event.type === "membership:update") {
        try {
          await store.updateRoomMemberRole(roomRecordId, ws.meta.userId, event.memberUserId, event.role);
          invalidateRoomRole(event.memberUserId, roomRecordId);
          const snapshot = await store.getRoomSnapshot(roomRecordId);
          broadcast(roomRecordId, {
            type: "room:members",
            roomId: roomSlug,
            members: snapshot?.members ?? [],
          });
          await publishAuditMessage(roomRecordId, roomSlug, {
            kind: "member-role-updated",
            actorName: ws.meta.name,
            actorUserId: ws.meta.userId,
            targetUserId: event.memberUserId,
            role: event.role,
          }, `${ws.meta.name} changed a member's role to ${event.role}.`);
          await logSecurityEvent({
            kind: "ws.membership.updated",
            userId: ws.meta.userId,
            sessionId: ws.meta.sessionId,
            roomId: roomRecordId,
            metadata: { targetUserId: event.memberUserId, role: event.role },
          });
        } catch (error) {
          safeSend(ws, {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to update member role.",
          });
        }
        return;
      }

      if (event.type === "ping") {
        safeSend(ws, { type: "pong", ts: Date.now() });
        return;
      }
    });

    ws.on("close", () => {
      const roomRecordId = ws.meta?.roomRecordId;
      leaveRoom(socketId, ws);
      if (roomRecordId) {
        const state = rooms.get(roomRecordId);
        if (!state) invalidateAllRolesForRoom(roomRecordId);
      }
    });

    ws.on("error", () => {
      leaveRoom(socketId, ws);
    });
  };
}
