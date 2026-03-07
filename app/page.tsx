"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  CircleSlash2,
  FolderTree,
  Keyboard,
  LoaderCircle,
  MessageSquareText,
  Moon,
  PanelBottomOpen,
  Pin,
  SendHorizontal,
  Sparkles,
  Sun,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

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

type ToastNotice = {
  id: string;
  title: string;
  detail?: string;
  variant?: "default" | "success" | "danger";
};

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
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const agentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const joinShortcutRef = useRef<() => void>(() => {});
  const sendShortcutRef = useRef<() => void>(() => {});
  const agentShortcutRef = useRef<() => void>(() => {});
  const toastTimeoutsRef = useRef<number[]>([]);

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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const storedTheme = window.localStorage.getItem("paircode-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
    return prefersDark ? "dark" : "light";
  });
  const [showHints, setShowHints] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("paircode-hints-hidden") !== "true";
  });
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

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

  const modeLabel = useMemo(() => {
    if (agentMode === "summarize") return "Summarize";
    if (agentMode === "next-steps") return "Next Steps";
    return "Answer";
  }, [agentMode]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastNotice, "id">) => {
    const id = crypto.randomUUID();
    setToasts((previous) => [...previous, { id, ...toast }]);
    const timeout = window.setTimeout(() => {
      setToasts((previous) => previous.filter((item) => item.id !== id));
    }, 2500);
    toastTimeoutsRef.current.push(timeout);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    pushToast({ title: `Switched to ${next} theme`, variant: "default" });
  }, [pushToast, theme]);

  const handleJoin = useCallback(() => {
    if (!roomId.trim() || !name.trim()) {
      pushToast({ title: "Room ID and display name are required", variant: "danger" });
      return;
    }

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
      pushToast({ title: `Connected to ${roomId.trim()}`, variant: "success" });
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
      pushToast({ title: "Disconnected from room", variant: "danger" });
    });

    socket.addEventListener("error", () => {
      setStatus("disconnected");
      setLastError("Failed to connect to real-time server.");
      pushToast({ title: "Connection error", detail: "Failed to reach real-time server.", variant: "danger" });
    });
  }, [name, pushToast, roomId]);

  const handleSendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text) {
      pushToast({ title: "Write a message first", variant: "danger" });
      return;
    }

    send({ type: "chat", text });
    send({ type: "typing", isTyping: false });
    setMessageInput("");
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [messageInput, pushToast, send]);

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

  const askAgent = useCallback((mode: AgentMode) => {
    if (agentStreaming) {
      pushToast({ title: "Agent is already streaming", variant: "default" });
      return;
    }
    if (!agentInput.trim()) {
      pushToast({ title: "Type a prompt before running the agent", variant: "danger" });
      return;
    }
    setLastError("");
    send({
      type: "ai:ask",
      mode,
      question: agentInput,
    });
    pushToast({ title: `Agent run started (${mode})`, variant: "success" });
  }, [agentInput, agentStreaming, pushToast, send]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      for (const timeout of toastTimeoutsRef.current) {
        window.clearTimeout(timeout);
      }
    },
    []
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sortedMessages.length]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("paircode-theme", theme);
  }, [theme]);

  useEffect(() => {
    joinShortcutRef.current = handleJoin;
    sendShortcutRef.current = handleSendMessage;
    agentShortcutRef.current = () => askAgent(agentMode);
  }, [agentMode, askAgent, handleJoin, handleSendMessage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m" && event.shiftKey) {
        event.preventDefault();
        messageInputRef.current?.focus();
        return;
      }

      if (event.key.toLowerCase() === "j" && event.shiftKey) {
        event.preventDefault();
        joinShortcutRef.current();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "textarea") {
          event.preventDefault();
          agentShortcutRef.current();
          return;
        }

        if (activeTag === "input") {
          event.preventDefault();
          sendShortcutRef.current();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobilePaletteOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobilePaletteOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobilePaletteOpen]);

  function dismissHints() {
    setShowHints(false);
    window.localStorage.setItem("paircode-hints-hidden", "true");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-8 text-foreground">
      <div className="float-glow pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-[rgba(216,93,45,0.15)] blur-3xl" />
      <div className="float-glow pointer-events-none absolute right-4 top-24 h-52 w-52 rounded-full bg-[rgba(61,137,130,0.14)] blur-3xl" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pt-5 lg:px-6 lg:pt-7">
        <Card className="fade-up">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <p className="mono-label text-xs text-(--muted)">Realtime Collaboration Workspace</p>
                <CardTitle className="text-3xl leading-tight lg:text-4xl">PairCode Room</CardTitle>
                <CardDescription className="max-w-xl">
                  A focused command center for collaborative implementation: presence, pinned context, and streaming AI support in one synchronized space.
                </CardDescription>
              </div>

              <div className="space-y-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Badge variant={statusBadgeVariant}>
                    {status === "connected" ? <Wifi className="mr-1.5 h-3 w-3" /> : <WifiOff className="mr-1.5 h-3 w-3" />}
                    {status}
                  </Badge>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle color theme"
                    title="Toggle theme"
                  >
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mono-label text-xs text-(--muted)">socket: {mySocketId ? mySocketId.slice(0, 8) : "not connected"}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="Room ID" />
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
              <Button onClick={handleJoin} type="button">
                {status === "connecting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {status === "connecting" ? "Connecting..." : "Join Room"}
              </Button>
              <div className="mono-label flex items-center rounded-lg border border-(--line) bg-(--surface-strong) px-3 py-2 text-xs text-(--muted)">
                {activeRoom ? `active room: ${activeRoom}` : "active room: none"}
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-2 text-xs text-(--muted) md:grid-cols-3">
              <div className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2">Participants: {users.length}</div>
              <div className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2">Messages: {sortedMessages.length}</div>
              <div className="rounded-lg border border-(--line) bg-(--surface) px-3 py-2">Agent Mode: {modeLabel}</div>
            </div>

            {showHints ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-(--line) bg-(--surface) p-2.5">
                <span className="mono-label text-[10px] text-(--muted)">Shortcuts</span>
                <Badge>Shift+M focus message</Badge>
                <Badge>Shift+J join room</Badge>
                <Badge>Ctrl/Cmd+Enter send/run</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={dismissHints} className="ml-auto">
                  <CircleSlash2 className="h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section className="fade-up-delay grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)_350px]">
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-(--accent)" /> Team Presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between rounded-lg border border-(--line) bg-(--surface) px-2.5 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      {user.id === mySocketId ? <Badge>you</Badge> : null}
                    </li>
                  ))}
                </ul>
                {users.length === 0 ? <p className="mt-3 text-sm text-(--muted)">Join a room to see active collaborators.</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workflow Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-(--muted)">
                <p>Open a second tab to simulate another teammate in the same room.</p>
                <p>Pin important file paths and requirements before invoking the room agent.</p>
                <p>Press Enter to send quickly during active discussion.</p>
                <Separator className="my-3" />
                <p className="flex items-center gap-2 text-xs">
                  <Keyboard className="h-3.5 w-3.5" /> Shift+M jumps to message input.
                </p>
              </CardContent>
            </Card>
          </aside>

          <Card className="flex min-h-[60vh] flex-col">
            <CardHeader className="border-b border-(--line)">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="h-4 w-4 text-(--accent)" /> Message Stream
                </CardTitle>
                <Badge>{sortedMessages.length} items</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-3 p-3">
              <ScrollArea className="h-[46vh] pr-1">
                <div className="space-y-3">
                  {sortedMessages.map((message) => (
                    <article
                      key={message.id}
                      className={
                        isAgentMessage(message)
                          ? "rounded-xl border border-[#99c8ad] bg-[linear-gradient(130deg,#effbf3,#e6f6f9)] p-3"
                          : "rounded-xl border border-(--line) bg-(--surface) p-3"
                      }
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-(--muted)">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className={isAgentMessage(message) ? "border-[#96c8a8] bg-[#ecf9ef] text-[#256949] text-[10px]" : "text-[10px]"}>
                              {initialsFromName(message.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{message.userName}</span>
                          {isAgentMessage(message) ? <Badge variant="success">AI</Badge> : null}
                        </div>
                        <span className="mono-label text-[10px]">{formatTime(message.timestamp)}</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
                        {message.text || (message.isStreaming ? "..." : "")}
                      </pre>
                    </article>
                  ))}

                  {sortedMessages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-(--line) bg-(--surface) p-4 text-sm text-(--muted)">
                      <p className="mb-2">No messages yet. Start the conversation.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setMessageInput("Can someone summarize the current implementation approach?");
                            pushToast({ title: "Starter message inserted", variant: "default" });
                          }}
                        >
                          Insert starter message
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => messageInputRef.current?.focus()}>
                          Focus input
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              <div>
                <div className="mb-2 h-4 text-xs text-(--muted)">{typingIndicator || ""}</div>
                <div className="flex gap-2">
                  <Input
                    ref={messageInputRef}
                    className="flex-1"
                    value={messageInput}
                    onChange={(event) => handleTyping(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Share context, code decisions, or blockers"
                  />
                  <Button type="button" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <SendHorizontal className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderTree className="h-4 w-4 text-(--accent)" /> Shared Context
                </CardTitle>
                <CardDescription>Keep everyone aligned with selected code and immutable constraints.</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="mono-label mb-1 block text-[10px] text-(--muted)">Selected files or snippets</label>
                <Textarea
                  className="mb-3 h-24"
                  value={context.selectedFiles}
                  onChange={(event) => updateContext({ ...context, selectedFiles: event.target.value })}
                  placeholder="src/app/page.tsx\nsrc/lib/realtime.ts"
                />

                <label className="mono-label mb-1 block text-[10px] text-(--muted)">Pinned requirements</label>
                <Textarea
                  className="h-24"
                  value={context.pinnedRequirements}
                  onChange={(event) => updateContext({ ...context, pinnedRequirements: event.target.value })}
                  placeholder="Must support optimistic updates and strict TypeScript."
                />

                {lastContextUpdateBy ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-(--muted)">
                    <Pin className="h-3.5 w-3.5" /> Updated by {lastContextUpdateBy}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-(--accent)" /> Room Agent
                </CardTitle>
                <CardDescription>Ask, summarize, and generate practical next steps from room context.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  ref={agentInputRef}
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
                    <Bot className="h-4 w-4" /> Ask
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
                    Summarize
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
                    Next Steps
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-(--muted)">
                  {agentStreaming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{agentStreaming ? "Room Agent is streaming..." : "Room Agent is ready"}</span>
                </div>
                <p className="mt-1 text-[11px] text-(--muted)">Tip: place focus in this box and press Ctrl/Cmd+Enter to run the selected mode.</p>
                {lastError ? <p className="mt-2 text-xs text-[#b03a2e]">{lastError}</p> : null}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>

      <button
        type="button"
        onClick={() => setMobilePaletteOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong) text-foreground shadow-[0_10px_30px_-18px_rgba(0,0,0,0.65)] lg:hidden"
        aria-label="Open command palette"
      >
        <PanelBottomOpen className="h-5 w-5" />
      </button>

      {mobilePaletteOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobilePaletteOpen(false)}
            aria-label="Close command palette"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-b-0 border-(--line) bg-(--surface) p-4 shadow-[0_-20px_35px_-25px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="mono-label text-xs text-(--muted)">Command Palette</p>
              <Button type="button" size="icon" variant="ghost" onClick={() => setMobilePaletteOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  messageInputRef.current?.focus();
                  setMobilePaletteOpen(false);
                }}
              >
                Focus Message
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  handleJoin();
                  setMobilePaletteOpen(false);
                }}
              >
                Join Room
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  askAgent(agentMode);
                  setMobilePaletteOpen(false);
                }}
              >
                Run Agent
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  toggleTheme();
                  setMobilePaletteOpen(false);
                }}
              >
                {theme === "light" ? "Dark Theme" : "Light Theme"}
              </Button>
            </div>

            <div className="mt-3 rounded-lg border border-(--line) bg-(--surface-strong) p-2.5 text-xs text-(--muted)">
              <p className="mb-1 font-medium">Keyboard</p>
              <p>Shift+M: Focus message</p>
              <p>Shift+J: Join room</p>
              <p>Ctrl/Cmd+Enter: Send or run</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.variant === "success"
                ? "toast-in pointer-events-auto rounded-xl border border-[#96c8a8] bg-[#e9f8ee] p-3 text-[#225b40]"
                : toast.variant === "danger"
                  ? "toast-in pointer-events-auto rounded-xl border border-[#e7a49b] bg-[#fdeceb] p-3 text-[#8d2d2a]"
                  : "toast-in pointer-events-auto rounded-xl border border-(--line) bg-(--surface-strong) p-3 text-foreground"
            }
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.detail ? <p className="mt-1 text-xs opacity-80">{toast.detail}</p> : null}
          </div>
        ))}
      </div>
    </main>
  );
}
