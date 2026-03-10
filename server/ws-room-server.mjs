import {
  buildAgentPrompt as defaultBuildAgentPrompt,
  buildFallbackResponse as defaultBuildFallbackResponse,
} from "./agent-utils.mjs";

export function createRoomConnectionHandler({
  verifySessionToken,
  store,
  ai = {},
  inviteLinks = {},
}) {
  const rooms = new Map();
  const buildAgentPrompt = ai.buildAgentPrompt ?? defaultBuildAgentPrompt;
  const buildFallbackResponse = ai.buildFallbackResponse ?? defaultBuildFallbackResponse;
  const streamResponse = ai.streamResponse;
  const createInviteToken = inviteLinks.createInviteToken ?? (() => null);
  const verifyInviteToken = inviteLinks.verifyInviteToken ?? (() => null);

  function ensureRoomState(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        clients: new Map(),
        activeAgentRun: null,
      });
    }

    return rooms.get(roomId);
  }

  function toJson(payload) {
    return JSON.stringify(payload);
  }

  function safeSend(client, payload) {
    if (client.readyState === client.OPEN) {
      client.send(toJson(payload));
    }
  }

  function broadcast(roomId, payload, options = {}) {
    const roomState = rooms.get(roomId);
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
      authUserId: client.meta?.userId ?? undefined,
    };
  }

  async function serializeRoom(roomId) {
    const roomSnapshot = await store.getRoomSnapshot(roomId);
    const roomState = rooms.get(roomId);
    const inviteToken = roomSnapshot.activeInvite
      ? createInviteToken({
          roomId,
          inviteCode: roomSnapshot.activeInvite.code,
          expiresAt: roomSnapshot.activeInvite.expiresAt,
        })
      : null;

    return {
      users: roomState ? [...roomState.clients.entries()].map(([id, client]) => serializeUser(id, client)) : [],
      messages: roomSnapshot.messages,
      owner: roomSnapshot.owner,
      members: roomSnapshot.members,
      activeInvite: roomSnapshot.activeInvite && inviteToken
        ? {
            token: inviteToken,
            expiresAt: roomSnapshot.activeInvite.expiresAt,
          }
        : null,
      context: roomSnapshot.context,
    };
  }

  async function publishAuditMessage(roomId, auditMetadata, text) {
    const message = {
      id: crypto.randomUUID(),
      type: "system",
      userId: "room-audit",
      userName: "Room Audit",
      text,
      timestamp: new Date().toISOString(),
      auditMetadata,
    };

    await store.createRoomMessage(roomId, message);
    broadcast(roomId, {
      type: "chat",
      roomId,
      message,
    });
  }

  function disconnectMemberSockets(roomId, memberAuthUserId, reason) {
    const roomState = rooms.get(roomId);
    if (!roomState) return;

    for (const client of roomState.clients.values()) {
      if (client.meta?.userId !== memberAuthUserId) continue;
      safeSend(client, { type: "error", error: reason });
      client.close();
    }
  }

  async function runRoomAgent({ roomId, requesterId, mode, question }) {
    const roomState = ensureRoomState(roomId);
    const runId = crypto.randomUUID();
    roomState.activeAgentRun = runId;

    const roomSnapshot = await serializeRoom(roomId);
    const prompt = buildAgentPrompt({ mode, question, roomSnapshot });
    const startedAt = new Date().toISOString();

    await store.createRoomMessage(roomId, {
      id: runId,
      type: "ai",
      userId: "room-agent",
      userName: "Room Agent",
      text: "",
      timestamp: startedAt,
      mode,
      isStreaming: true,
    });

    broadcast(roomId, {
      type: "ai:start",
      roomId,
      runId,
      mode,
      by: requesterId,
      startedAt,
    });

    let fullText = "";

    try {
      if (streamResponse) {
        for await (const token of streamResponse(prompt)) {
          if (roomState.activeAgentRun !== runId) {
            break;
          }
          fullText += token;
          broadcast(roomId, {
            type: "ai:chunk",
            roomId,
            runId,
            token,
          });
        }
      } else {
        const fallback = buildFallbackResponse(mode, roomSnapshot, question);
        const parts = fallback.split(/(\s+)/).filter(Boolean);
        for (const token of parts) {
          if (roomState.activeAgentRun !== runId) {
            break;
          }
          fullText += token;
          broadcast(roomId, {
            type: "ai:chunk",
            roomId,
            runId,
            token,
          });
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

      await store.updateRoomMessage(roomId, runId, {
        text: message.text,
        timestamp: message.timestamp,
        mode,
        isStreaming: false,
      });

      roomState.activeAgentRun = null;

      broadcast(roomId, {
        type: "ai:done",
        roomId,
        runId,
        message,
      });
    } catch (error) {
      roomState.activeAgentRun = null;
      const detail = error instanceof Error ? error.message : "Unknown AI error";
      await store.updateRoomMessage(roomId, runId, {
        text: fullText || "Agent run failed.",
        mode,
        isStreaming: false,
      }).catch(() => undefined);
      broadcast(roomId, {
        type: "ai:error",
        roomId,
        runId,
        error: detail,
      });
    }
  }

  function leaveRoom(socketId, ws) {
    const roomId = ws.meta?.roomId;
    if (!roomId) return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    const user = serializeUser(socketId, ws);
    roomState.clients.delete(socketId);
    ws.meta.roomId = null;

    broadcast(roomId, {
      type: "presence",
      roomId,
      event: "leave",
      user,
      users: [...roomState.clients.entries()].map(([id, client]) => serializeUser(id, client)),
    });

    if (roomState.clients.size === 0) {
      rooms.delete(roomId);
    }
  }

  return function handleConnection(ws) {
    const socketId = crypto.randomUUID();
    ws.meta = {
      id: socketId,
      roomId: null,
      userId: null,
      name: "Anonymous",
    };

    safeSend(ws, {
      type: "connected",
      socketId,
      now: new Date().toISOString(),
    });

    ws.on("message", async (raw) => {
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        safeSend(ws, { type: "error", error: "Invalid JSON payload" });
        return;
      }

      if (payload.type === "join") {
        let roomId = String(payload.roomId || "").trim();
        const name = String(payload.userName || "Anonymous").trim() || "Anonymous";
        const sessionToken = String(payload.sessionToken || "").trim();
        const inviteToken = String(payload.inviteToken || "").trim();
        let inviteCode = "";

        if (!sessionToken) {
          safeSend(ws, { type: "error", error: "Authentication is required before joining a room." });
          ws.close();
          return;
        }

        let verifiedToken;
        try {
          verifiedToken = await verifySessionToken(sessionToken);
        } catch {
          safeSend(ws, { type: "error", error: "Failed to verify the authenticated session for this room." });
          ws.close();
          return;
        }

        const userId = String(verifiedToken.sub || "").trim() || null;
        if (!userId) {
          safeSend(ws, { type: "error", error: "Verified session is missing a user identity." });
          ws.close();
          return;
        }

        if (inviteToken) {
          const verifiedInvite = verifyInviteToken(inviteToken);
          if (!verifiedInvite) {
            safeSend(ws, { type: "error", error: "Invite link is invalid or expired for this room." });
            ws.close();
            return;
          }

          if (roomId && roomId !== verifiedInvite.roomId) {
            safeSend(ws, { type: "error", error: "Invite link does not match the selected room." });
            ws.close();
            return;
          }

          roomId = verifiedInvite.roomId;
          inviteCode = verifiedInvite.inviteCode;
        }

        roomId = roomId || "main";

        if (ws.meta.roomId && ws.meta.roomId !== roomId) {
          leaveRoom(socketId, ws);
        }

        const joinResult = await store.authorizeRoomJoin(roomId, {
          authUserId: userId,
          name,
        }, inviteCode);

        if (!joinResult.ok) {
          safeSend(ws, { type: "error", error: joinResult.error });
          ws.close();
          return;
        }

        const roomState = ensureRoomState(roomId);

        ws.meta.roomId = roomId;
        ws.meta.name = name;
        ws.meta.userId = userId;
        roomState.clients.set(socketId, ws);

        const snapshot = await serializeRoom(roomId);
        const canManageRoom = snapshot.owner?.authUserId === userId;
        safeSend(ws, {
          type: "room:snapshot",
          roomId,
          ...snapshot,
          permissions: {
            canManageRoom,
          },
          activeInvite: canManageRoom ? snapshot.activeInvite : null,
        });

        broadcast(roomId, {
          type: "presence",
          roomId,
          event: "join",
          user: serializeUser(socketId, ws),
          users: snapshot.users,
        }, { exclude: socketId });

        if (joinResult.createdRoom) {
          await publishAuditMessage(roomId, {
            kind: "room-created",
            actorName: name,
            actorAuthUserId: userId,
          }, `${name} created this room and became its owner.`);
        } else if (joinResult.joinedViaInvite) {
          await publishAuditMessage(roomId, {
            kind: "member-added",
            actorName: name,
            actorAuthUserId: userId,
            targetName: name,
            targetAuthUserId: userId,
          }, `${name} joined through an invite link and was added to the room access list.`);
        }

        return;
      }

      const roomId = ws.meta.roomId;
      if (!roomId) {
        safeSend(ws, { type: "error", error: "Join a room before sending events" });
        return;
      }

      if (payload.type === "chat") {
        const text = String(payload.text || "").trim();
        if (!text) return;

        const message = {
          id: crypto.randomUUID(),
          type: "chat",
          userId: ws.meta.userId ?? socketId,
          userName: ws.meta.name,
          text,
          timestamp: new Date().toISOString(),
        };

        await store.createRoomMessage(roomId, message);
        broadcast(roomId, {
          type: "chat",
          roomId,
          message,
        });
        return;
      }

      if (payload.type === "typing") {
        broadcast(roomId, {
          type: "typing",
          roomId,
          user: serializeUser(socketId, ws),
          isTyping: Boolean(payload.isTyping),
        }, { exclude: socketId });
        return;
      }

      if (payload.type === "context:update") {
        const canManage = await store.canManageRoom(roomId, ws.meta.userId);
        if (!canManage) {
          safeSend(ws, { type: "error", error: "Only the room owner can update the shared context." });
          return;
        }

        const currentSnapshot = await store.getRoomSnapshot(roomId);
        const context = await store.updateRoomContext(roomId, {
          selectedFiles: String(payload.context?.selectedFiles ?? currentSnapshot.context.selectedFiles),
          pinnedRequirements: String(payload.context?.pinnedRequirements ?? currentSnapshot.context.pinnedRequirements),
        });

        broadcast(roomId, {
          type: "context",
          roomId,
          context,
          updatedBy: serializeUser(socketId, ws),
        });
        return;
      }

      if (payload.type === "ai:ask") {
        const canManage = await store.canManageRoom(roomId, ws.meta.userId);
        if (!canManage) {
          safeSend(ws, { type: "error", error: "Only the room owner can run the room agent." });
          return;
        }

        const mode = payload.mode === "summarize" || payload.mode === "next-steps" ? payload.mode : "answer";
        const question = String(payload.question ?? "");
        runRoomAgent({
          roomId,
          requesterId: socketId,
          mode,
          question,
        });
        return;
      }

      if (payload.type === "invite:create") {
        const canManage = await store.canManageRoom(roomId, ws.meta.userId);
        if (!canManage) {
          safeSend(ws, { type: "error", error: "Only the room owner can create room invite links." });
          return;
        }

        try {
          const invite = await store.createRoomInvite(roomId, ws.meta.userId);
          const inviteToken = invite
            ? createInviteToken({
                roomId,
                inviteCode: invite.code,
                expiresAt: invite.expiresAt,
              })
            : null;
          const signedInvite = invite && inviteToken
            ? {
                token: inviteToken,
                expiresAt: invite.expiresAt,
              }
            : null;

          if (!signedInvite) {
            throw new Error("Invite link signing is not configured on the realtime server.");
          }

          safeSend(ws, {
            type: "invite:created",
            roomId,
            invite: signedInvite,
          });
          await publishAuditMessage(roomId, {
            kind: "invite-rotated",
            actorName: ws.meta.name,
            actorAuthUserId: ws.meta.userId,
          }, `${ws.meta.name} rotated the room invite link.`);
        } catch (error) {
          safeSend(ws, {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to create an invite link.",
          });
        }
        return;
      }

      if (payload.type === "membership:remove") {
        const canManage = await store.canManageRoom(roomId, ws.meta.userId);
        if (!canManage) {
          safeSend(ws, { type: "error", error: "Only the room owner can remove members." });
          return;
        }

        const memberAuthUserId = String(payload.memberAuthUserId || "").trim();
        if (!memberAuthUserId) {
          safeSend(ws, { type: "error", error: "Choose a valid member before removing access." });
          return;
        }

        try {
          const currentSnapshot = await store.getRoomSnapshot(roomId);
          const targetMember = currentSnapshot.members.find((member) => member.authUserId === memberAuthUserId);
          const members = await store.removeRoomMember(roomId, ws.meta.userId, memberAuthUserId);
          disconnectMemberSockets(roomId, memberAuthUserId, "Your access to this room was revoked by the room owner.");
          broadcast(roomId, {
            type: "room:members",
            roomId,
            members,
          });
          await publishAuditMessage(roomId, {
            kind: "member-removed",
            actorName: ws.meta.name,
            actorAuthUserId: ws.meta.userId,
            targetName: targetMember?.name,
            targetAuthUserId: memberAuthUserId,
          }, `${ws.meta.name} removed ${targetMember?.name ?? "a member"} from the room access list.`);
        } catch (error) {
          safeSend(ws, {
            type: "error",
            error: error instanceof Error ? error.message : "Failed to remove room member.",
          });
        }
        return;
      }

      if (payload.type === "ping") {
        safeSend(ws, { type: "pong", ts: Date.now() });
        return;
      }

      safeSend(ws, { type: "error", error: `Unknown event type: ${String(payload.type)}` });
    });

    ws.on("close", () => {
      leaveRoom(socketId, ws);
    });

    ws.on("error", () => {
      leaveRoom(socketId, ws);
    });
  };
}