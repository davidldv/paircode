import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import {
  buildAgentPrompt,
  buildFallbackResponse,
  streamTokensFromSseStream,
} from "./agent-utils.mjs";
import { createSignedInviteToken, verifySignedInviteToken } from "./invite-link.mjs";
import {
  authorizeRoomJoin,
  createRoomInvite,
  createRoomMessage,
  getRoomSnapshot,
  removeRoomMember,
  updateRoomContext,
  updateRoomMemberRole,
  updateRoomMessage,
} from "./room-store.mjs";
import { createRoomConnectionHandler } from "./ws-room-server.mjs";
import { extractClientIp, hashIp } from "./security/request.mjs";
import { consumeToken, RATE_LIMITS } from "./security/rate-limit.mjs";
import { redeemWsTicket } from "./security/ws-ticket.mjs";
import { loadActiveSession } from "./security/session.mjs";
import { logSecurityEvent } from "./security/logger.mjs";

const PORT = Number(process.env.WS_PORT ?? 3001);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
const INVITE_SIGNING_SECRET = process.env.INVITE_SIGNING_SECRET;

if (!INVITE_SIGNING_SECRET) {
  throw new Error("INVITE_SIGNING_SECRET is required for the realtime server.");
}

async function* streamGeminiResponse(prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        stream: true,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are a collaborative room AI pair programmer. Give concise, practical guidance for the whole team. When useful, produce bullet points and concrete next actions.",
          },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "Unknown AI error");
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  yield* streamTokensFromSseStream(response.body);
}

const handleConnection = createRoomConnectionHandler({
  store: {
    authorizeRoomJoin,
    createRoomInvite,
    createRoomMessage,
    getRoomSnapshot,
    removeRoomMember,
    updateRoomContext,
    updateRoomMemberRole,
    updateRoomMessage,
  },
  ai: {
    buildAgentPrompt,
    buildFallbackResponse,
    streamResponse: GEMINI_API_KEY ? streamGeminiResponse : undefined,
  },
  inviteLinks: {
    createInviteToken: ({ roomId, inviteCode, expiresAt }) =>
      createSignedInviteToken({ roomId, inviteCode, expiresAt }, INVITE_SIGNING_SECRET),
    verifyInviteToken: (token) => verifySignedInviteToken(token, INVITE_SIGNING_SECRET),
  },
});

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

function rejectUpgrade(socket, status, reason) {
  try {
    socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
  } finally {
    socket.destroy();
  }
}

httpServer.on("upgrade", async (req, socket, head) => {
  socket.on("error", () => {
    try { socket.destroy(); } catch { /* ignore */ }
  });

  const ip = extractClientIp(req);
  const ipHash = hashIp(ip);

  const rl = consumeToken(`ws:connect:${ipHash}`, RATE_LIMITS.wsNewConnectionPerIp);
  if (!rl.allowed) {
    await logSecurityEvent({
      kind: "ws.connect.rate_limited",
      severity: "warn",
      ipHash,
      metadata: { retryAfterMs: rl.retryAfterMs },
    });
    rejectUpgrade(socket, 429, "Too Many Requests");
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/ws") {
    rejectUpgrade(socket, 404, "Not Found");
    return;
  }

  const ticket = url.searchParams.get("ticket");
  if (!ticket) {
    await logSecurityEvent({
      kind: "ws.connect.missing_ticket",
      severity: "warn",
      ipHash,
    });
    rejectUpgrade(socket, 401, "Unauthorized");
    return;
  }

  const redeemed = await redeemWsTicket(ticket);
  if (!redeemed) {
    await logSecurityEvent({
      kind: "ws.connect.invalid_ticket",
      severity: "warn",
      ipHash,
    });
    rejectUpgrade(socket, 401, "Unauthorized");
    return;
  }

  const session = await loadActiveSession(redeemed.sessionId);
  if (!session || session.userId !== redeemed.userId) {
    await logSecurityEvent({
      kind: "ws.connect.session_revoked",
      severity: "warn",
      userId: redeemed.userId,
      sessionId: redeemed.sessionId,
      ipHash,
    });
    rejectUpgrade(socket, 401, "Unauthorized");
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    logSecurityEvent({
      kind: "ws.connected",
      userId: session.userId,
      sessionId: session.sessionId,
      ipHash,
    }).catch(() => undefined);

    handleConnection(ws, {
      userId: session.userId,
      sessionId: session.sessionId,
      displayName: session.displayName,
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      try { ws.close(1011, "internal_error"); } catch { /* ignore */ }
      logSecurityEvent({
        kind: "ws.handler.failed",
        severity: "error",
        userId: session.userId,
        sessionId: session.sessionId,
        ipHash,
        metadata: { error: detail },
      }).catch(() => undefined);
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket room server running on ws://localhost:${PORT}/ws`);
});
