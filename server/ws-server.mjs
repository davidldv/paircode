import { WebSocketServer } from "ws";

const PORT = Number(process.env.WS_PORT ?? 3001);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const rooms = new Map();

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(),
      messages: [],
      context: {
        selectedFiles: "",
        pinnedRequirements: "",
      },
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
  const room = rooms.get(roomId);
  if (!room) return;

  const { exclude } = options;
  for (const [socketId, client] of room.clients.entries()) {
    if (exclude && socketId === exclude) continue;
    safeSend(client, payload);
  }
}

function serializeUser(socketId, client) {
  return {
    id: socketId,
    name: client.meta?.name ?? "Anonymous",
  };
}

function serializeRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return { users: [], messages: [], context: { selectedFiles: "", pinnedRequirements: "" } };
  }

  return {
    users: [...room.clients.entries()].map(([id, client]) => serializeUser(id, client)),
    messages: room.messages,
    context: room.context,
  };
}

function addMessage(roomId, message) {
  const room = ensureRoom(roomId);
  room.messages.push(message);
  if (room.messages.length > 150) {
    room.messages = room.messages.slice(-150);
  }
}

function buildFallbackResponse(mode, roomSnapshot, question) {
  const latestMessages = roomSnapshot.messages.slice(-6);
  const contextLines = [
    roomSnapshot.context.selectedFiles?.trim(),
    roomSnapshot.context.pinnedRequirements?.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  if (mode === "summarize") {
    return [
      "Room summary:",
      latestMessages.length
        ? latestMessages.map((m) => `- ${m.userName}: ${m.text}`).join("\n")
        : "- No chat history yet.",
      contextLines ? `\nPinned context:\n${contextLines}` : "",
    ].join("\n");
  }

  if (mode === "next-steps") {
    return [
      "Proposed next steps:",
      "1. Clarify the core requirement in one sentence.",
      "2. Split work into frontend, backend, and tests.",
      "3. Implement the smallest complete slice first.",
      "4. Validate with lint/tests and tighten edge cases.",
      contextLines ? `\nUse this room context while implementing:\n${contextLines}` : "",
    ].join("\n");
  }

  return [
    "Pair-agent suggestion:",
    question ? `Question: ${question}` : "No explicit question was provided.",
    "",
    "Suggested approach:",
    "- Start with an API contract and shared types.",
    "- Implement real-time events first, then persistence.",
    "- Add clear error states and loading indicators.",
    contextLines ? `\nContext to keep in scope:\n${contextLines}` : "",
  ].join("\n");
}

function parseSseLine(line) {
  if (!line.startsWith("data:")) return null;
  const jsonText = line.slice(5).trim();
  if (!jsonText || jsonText === "[DONE]") return "[DONE]";
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

async function* streamOpenAIResponse(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
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
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const parsed = parseSseLine(line.trim());
      if (!parsed || parsed === "[DONE]") continue;
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }
}

function buildAgentPrompt({ mode, question, roomSnapshot }) {
  const shortMessages = roomSnapshot.messages.slice(-25).map((message) => ({
    user: message.userName,
    text: message.text,
    at: message.timestamp,
  }));

  return [
    `Mode: ${mode}`,
    question ? `Question: ${question}` : "Question: (none)",
    "",
    "Shared context:",
    roomSnapshot.context.selectedFiles || "(no selected files/snippets)",
    "",
    "Pinned requirements:",
    roomSnapshot.context.pinnedRequirements || "(none)",
    "",
    "Recent room messages (JSON):",
    JSON.stringify(shortMessages, null, 2),
    "",
    "Respond for a team in a real-time pair programming room.",
    "If mode is summarize, provide a concise summary.",
    "If mode is next-steps, provide an ordered implementation plan.",
    "If mode is answer, directly answer the question and include practical coding guidance.",
  ].join("\n");
}

async function runRoomAgent({ roomId, requesterId, mode, question }) {
  const room = ensureRoom(roomId);
  const runId = crypto.randomUUID();
  room.activeAgentRun = runId;

  const roomSnapshot = serializeRoom(roomId);
  const prompt = buildAgentPrompt({ mode, question, roomSnapshot });
  const startedAt = new Date().toISOString();

  const aiStart = {
    type: "ai:start",
    roomId,
    runId,
    mode,
    by: requesterId,
    startedAt,
  };

  addMessage(roomId, {
    id: runId,
    type: "ai",
    userId: "room-agent",
    userName: "Room Agent",
    text: "",
    timestamp: startedAt,
    mode,
    isStreaming: true,
  });

  broadcast(roomId, aiStart);

  let fullText = "";

  try {
    if (OPENAI_API_KEY) {
      for await (const token of streamOpenAIResponse(prompt)) {
        if (room.activeAgentRun !== runId) {
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
        if (room.activeAgentRun !== runId) {
          break;
        }
        fullText += token;
        broadcast(roomId, {
          type: "ai:chunk",
          roomId,
          runId,
          token,
        });
        await new Promise((resolve) => setTimeout(resolve, 30));
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

    const roomState = ensureRoom(roomId);
    roomState.messages = roomState.messages.map((item) =>
      item.id === runId
        ? message
        : item
    );

    room.activeAgentRun = null;

    broadcast(roomId, {
      type: "ai:done",
      roomId,
      runId,
      message,
    });
  } catch (error) {
    room.activeAgentRun = null;
    const detail = error instanceof Error ? error.message : "Unknown AI error";
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

  const room = rooms.get(roomId);
  if (!room) return;

  const user = serializeUser(socketId, ws);
  room.clients.delete(socketId);

  broadcast(roomId, {
    type: "presence",
    roomId,
    event: "leave",
    user,
    users: [...room.clients.entries()].map(([id, client]) => serializeUser(id, client)),
  });

  if (room.clients.size === 0) {
    rooms.delete(roomId);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  const socketId = crypto.randomUUID();
  ws.meta = {
    id: socketId,
    roomId: null,
    name: "Anonymous",
  };

  safeSend(ws, {
    type: "connected",
    socketId,
    now: new Date().toISOString(),
  });

  ws.on("message", (raw) => {
    let payload;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      safeSend(ws, { type: "error", error: "Invalid JSON payload" });
      return;
    }

    if (payload.type === "join") {
      const roomId = String(payload.roomId || "main").trim() || "main";
      const name = String(payload.userName || "Anonymous").trim() || "Anonymous";
      const room = ensureRoom(roomId);

      ws.meta.roomId = roomId;
      ws.meta.name = name;
      room.clients.set(socketId, ws);

      const snapshot = serializeRoom(roomId);
      safeSend(ws, {
        type: "room:snapshot",
        roomId,
        ...snapshot,
      });

      broadcast(roomId, {
        type: "presence",
        roomId,
        event: "join",
        user: serializeUser(socketId, ws),
        users: snapshot.users,
      }, { exclude: socketId });

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
        userId: socketId,
        userName: ws.meta.name,
        text,
        timestamp: new Date().toISOString(),
      };

      addMessage(roomId, message);
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
      const room = ensureRoom(roomId);
      room.context = {
        selectedFiles: String(payload.context?.selectedFiles ?? room.context.selectedFiles),
        pinnedRequirements: String(payload.context?.pinnedRequirements ?? room.context.pinnedRequirements),
      };

      broadcast(roomId, {
        type: "context",
        roomId,
        context: room.context,
        updatedBy: serializeUser(socketId, ws),
      });
      return;
    }

    if (payload.type === "ai:ask") {
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
});

console.log(`WebSocket room server running on ws://localhost:${PORT}`);
