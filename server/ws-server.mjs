import { verifyToken } from "@clerk/backend";
import { WebSocketServer } from "ws";

import {
  buildAgentPrompt,
  buildFallbackResponse,
  streamTokensFromSseStream,
} from "./agent-utils.mjs";
import { createSignedInviteToken, verifySignedInviteToken } from "./invite-link.mjs";
import {
  authorizeRoomJoin,
  canManageRoom,
  createRoomInvite,
  createRoomMessage,
  getRoomSnapshot,
  removeRoomMember,
  updateRoomContext,
  updateRoomMessage,
} from "./room-store.mjs";
import { createRoomConnectionHandler } from "./ws-room-server.mjs";

const PORT = Number(process.env.WS_PORT ?? 3001);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_JWT_KEY = process.env.CLERK_JWT_KEY;
const INVITE_SIGNING_SECRET = process.env.INVITE_SIGNING_SECRET ?? CLERK_SECRET_KEY;
const CLERK_AUTHORIZED_PARTIES = (process.env.CLERK_AUTHORIZED_PARTIES ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function verifySessionToken(sessionToken) {
  if (!CLERK_SECRET_KEY && !CLERK_JWT_KEY) {
    throw new Error("Clerk backend verification is not configured on the websocket server.");
  }

  return verifyToken(sessionToken, {
    ...(CLERK_SECRET_KEY ? { secretKey: CLERK_SECRET_KEY } : {}),
    ...(CLERK_JWT_KEY ? { jwtKey: CLERK_JWT_KEY } : {}),
    ...(CLERK_AUTHORIZED_PARTIES.length > 0 ? { authorizedParties: CLERK_AUTHORIZED_PARTIES } : {}),
  });
}

async function* streamGeminiResponse(prompt) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
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
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "Unknown AI error");
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  yield* streamTokensFromSseStream(response.body);
}

const handleConnection = createRoomConnectionHandler({
  verifySessionToken,
  store: {
    authorizeRoomJoin,
    canManageRoom,
    createRoomInvite,
    createRoomMessage,
    getRoomSnapshot,
    removeRoomMember,
    updateRoomContext,
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

const wss = new WebSocketServer({ port: PORT });
wss.on("connection", handleConnection);

console.log(`WebSocket room server running on ws://localhost:${PORT}`);