"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, MessageSquareText, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type RoomUser = {
  id: string;
  name: string;
};

type RoomContext = {
  selectedFiles: string;
  pinnedRequirements: string;
};

type ChatMessage = {
  id: string;
  type: "chat" | "ai";
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  mode?: "answer" | "summarize" | "next-steps";
  isStreaming?: boolean;
};

type AgentMode = "answer" | "summarize" | "next-steps";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsFromName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "??";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function isAgentMessage(message: ChatMessage) {
  return message.userId === "room-agent" || message.type === "ai";
}

export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [mySocketId, setMySocketId] = useState<string>("");
  const [roomId, setRoomId] = useState("main-room");
  const [name, setName] = useState("Dev");
  const [activeRoom, setActiveRoom] = useState("");
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [agentInput, setAgentInput] = useState("Help us split this ticket into concrete implementation tasks.");
  const [agentMode, setAgentMode] = useState<AgentMode>("answer");
  const [context, setContext] = useState<RoomContext>({
    selectedFiles: "",
    pinnedRequirements: "",
  });
  const [typingUsers, setTypingUsers] = useState<Record<string, RoomUser>>({});
  const [lastContextUpdateBy, setLastContextUpdateBy] = useState<string>("");
  const [agentStreaming, setAgentStreaming] = useState(false);
  const [lastError, setLastError] = useState("");

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages]
  );

  const typingIndicator = useMemo(() => {
    const names = Object.values(typingUsers).map((user) => user.name);
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2}` : ""} typing...`;
  }, [typingUsers]);

  const statusBadgeVariant = useMemo(() => {
    if (status === "connected") return "success" as const;
    if (status === "disconnected") return "danger" as const;
    return "default" as const;
  }, [status]);

  function send(payload: Record<string, unknown>) {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }

  function handleJoin() {
    if (!roomId.trim() || !name.trim()) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("connecting");
    setLastError("");

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setStatus("connected");
      socket.send(
        JSON.stringify({
          type: "join",
          roomId: roomId.trim(),
          userName: name.trim(),
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data)) as Record<string, unknown>;

      if (payload.type === "connected" && typeof payload.socketId === "string") {
        setMySocketId(payload.socketId);
        return;
      }

      if (payload.type === "room:snapshot") {
        setActiveRoom(String(payload.roomId || ""));
        setUsers((payload.users as RoomUser[]) || []);
        setMessages((payload.messages as ChatMessage[]) || []);
        setContext((payload.context as RoomContext) || { selectedFiles: "", pinnedRequirements: "" });
        setTypingUsers({});
        return;
      }

      if (payload.type === "presence") {
        setUsers((payload.users as RoomUser[]) || []);
        return;
      }

      if (payload.type === "typing") {
        const user = payload.user as RoomUser;
        const isTyping = Boolean(payload.isTyping);
        setTypingUsers((previous) => {
          const next = { ...previous };
          if (isTyping) next[user.id] = user;
          else delete next[user.id];
          return next;
        });
        return;
      }

      if (payload.type === "chat") {
        const message = payload.message as ChatMessage;
        setMessages((previous) => [...previous, message]);
        return;
      }

      if (payload.type === "context") {
        const nextContext = payload.context as RoomContext;
        setContext(nextContext);
        const updatedBy = payload.updatedBy as RoomUser;
        setLastContextUpdateBy(updatedBy?.name ?? "");
        return;
      }

      if (payload.type === "ai:start") {
        setAgentStreaming(true);
        const runId = String(payload.runId || crypto.randomUUID());
        const mode = (payload.mode as AgentMode | undefined) ?? "answer";
        const aiDraft: ChatMessage = {
          id: runId,
          type: "ai",
          userId: "room-agent",
          userName: "Room Agent",
          text: "",
          timestamp: new Date().toISOString(),
          mode,
          isStreaming: true,
        };
        setMessages((previous) => [...previous.filter((m) => m.id !== runId), aiDraft]);
        return;
      }

      if (payload.type === "ai:chunk") {
        const runId = String(payload.runId || "");
        const token = String(payload.token || "");
        if (!runId || !token) return;

        setMessages((previous) =>
          previous.map((message) =>
            message.id === runId
              ? {
                  ...message,
                  text: `${message.text}${token}`,
                  isStreaming: true,
                }
              : message
          )
        );
        return;
      }

      if (payload.type === "ai:done") {
        setAgentStreaming(false);
        const message = payload.message as ChatMessage;
        setMessages((previous) => previous.map((item) => (item.id === message.id ? message : item)));
        return;
      }

      if (payload.type === "ai:error") {
        setAgentStreaming(false);
        setLastError(String(payload.error || "AI failed"));
        return;
      }

      if (payload.type === "error") {
        setLastError(String(payload.error || "Unknown server error"));
      }
    });

    socket.addEventListener("close", () => {
      setStatus("disconnected");
      setTypingUsers({});
    });

    socket.addEventListener("error", () => {
      setStatus("disconnected");
      setLastError("Failed to connect to real-time server.");
    });
  }

  function handleSendMessage() {
    const text = messageInput.trim();
    if (!text) return;

    send({ type: "chat", text });
    send({ type: "typing", isTyping: false });
    setMessageInput("");
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function handleTyping(text: string) {
    setMessageInput(text);
    send({ type: "typing", isTyping: true });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      send({ type: "typing", isTyping: false });
      typingTimeoutRef.current = null;
    }, 1200);
  }

  function updateContext(nextContext: RoomContext) {
    setContext(nextContext);
    send({
      type: "context:update",
      context: nextContext,
    });
  }

  function askAgent(mode: AgentMode) {
    if (agentStreaming) return;
    setLastError("");
    send({
      type: "ai:ask",
      mode,
      question: agentInput,
    });
  }

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">AI Pair-Programming Room</CardTitle>
                <CardDescription>
                  Real-time collaboration with room presence, shared context, and live streaming AI suggestions.
                </CardDescription>
              </div>
              <Badge variant={statusBadgeVariant}>{status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="Room ID" />
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
              <Button onClick={handleJoin} variant="secondary" type="button">
                {status === "connecting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {status === "connecting" ? "Connecting..." : "Join Room"}
              </Button>
              <div className="flex items-center rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/20">
                <span className="font-medium">{activeRoom ? activeRoom : "No room selected"}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-black/60 dark:text-white/60">Tip: open multiple tabs and join the same room to simulate a team.</p>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Presence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between rounded-md border border-black/10 px-2 py-1.5 text-sm dark:border-white/20">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                    {user.id === mySocketId ? <Badge variant="default">you</Badge> : null}
                  </li>
                ))}
              </ul>
              {users.length === 0 ? <p className="mt-3 text-sm text-black/60 dark:text-white/60">Join a room to see participants.</p> : null}
            </CardContent>
          </Card>

          <Card className="flex min-h-[58vh] flex-col">
            <CardHeader className="border-b border-black/10 dark:border-white/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="h-4 w-4" /> Shared Message Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 p-3">
              <ScrollArea className="h-[44vh] pr-1">
                <div className="space-y-3">
                  {sortedMessages.map((message) => (
                    <article
                      key={message.id}
                      className={
                        isAgentMessage(message)
                          ? "rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3"
                          : "rounded-lg border border-black/10 p-3 dark:border-white/20"
                      }
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-black/65 dark:text-white/65">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className={
                                isAgentMessage(message)
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]"
                                  : "text-[10px]"
                              }
                            >
                              {initialsFromName(message.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{message.userName}</span>
                          {isAgentMessage(message) ? <Badge variant="success">AI</Badge> : null}
                        </div>
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm leading-6 font-sans">{message.text || (message.isStreaming ? "..." : "")}</pre>
                    </article>
                  ))}
                  {sortedMessages.length === 0 ? <p className="text-sm text-black/60 dark:text-white/60">No messages yet.</p> : null}
                </div>
              </ScrollArea>

              <Separator />
              <div>
                <div className="mb-2 h-4 text-xs text-black/60 dark:text-white/60">{typingIndicator || ""}</div>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={messageInput}
                    onChange={(event) => handleTyping(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message"
                  />
                  <Button type="button" variant="secondary" onClick={handleSendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shared Context</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="mb-1 block text-xs text-black/65 dark:text-white/65">Selected files/snippets</label>
                <Textarea
                  className="mb-3 h-24"
                  value={context.selectedFiles}
                  onChange={(event) => updateContext({ ...context, selectedFiles: event.target.value })}
                  placeholder="src/app/page.tsx\nsrc/lib/realtime.ts"
                />

                <label className="mb-1 block text-xs text-black/65 dark:text-white/65">Pinned requirements</label>
                <Textarea
                  className="h-24"
                  value={context.pinnedRequirements}
                  onChange={(event) => updateContext({ ...context, pinnedRequirements: event.target.value })}
                  placeholder="Must support optimistic updates and strict TypeScript."
                />

                {lastContextUpdateBy ? (
                  <p className="mt-2 text-xs text-black/60 dark:text-white/60">Updated by {lastContextUpdateBy}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4" /> Room Agent
                </CardTitle>
                <CardDescription>Ask, summarize, or request implementation next steps.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="h-28"
                  value={agentInput}
                  onChange={(event) => setAgentInput(event.target.value)}
                  placeholder="Ask the room agent a question..."
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant={agentMode === "answer" ? "default" : "secondary"}
                    type="button"
                    onClick={() => {
                      setAgentMode("answer");
                      askAgent("answer");
                    }}
                    disabled={agentStreaming}
                  >
                    Ask
                  </Button>
                  <Button
                    variant={agentMode === "summarize" ? "default" : "secondary"}
                    type="button"
                    onClick={() => {
                      setAgentMode("summarize");
                      askAgent("summarize");
                    }}
                    disabled={agentStreaming}
                  >
                    Summarize Thread
                  </Button>
                  <Button
                    variant={agentMode === "next-steps" ? "default" : "secondary"}
                    type="button"
                    onClick={() => {
                      setAgentMode("next-steps");
                      askAgent("next-steps");
                    }}
                    disabled={agentStreaming}
                  >
                    Propose Next Steps
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                  {agentStreaming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{agentStreaming ? "Room Agent is streaming..." : "Agent idle"}</span>
                </div>
                {lastError ? <p className="mt-2 text-xs text-red-500">{lastError}</p> : null}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
