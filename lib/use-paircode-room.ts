"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { authFetch } from "@/lib/auth-client";
import { type AgentMode, type ChatMessage, type RoomContext, type RoomInvite, type RoomMember, type RoomOwner, type RoomUser, type ToastNotice } from "@/lib/paircode";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

function buildWsUrl(ticket: string) {
  const separator = WS_BASE_URL.includes("?") ? "&" : "?";
  const base = WS_BASE_URL.endsWith("/ws") ? WS_BASE_URL : `${WS_BASE_URL.replace(/\/$/, "")}/ws`;
  return `${base}${separator}ticket=${encodeURIComponent(ticket)}`;
}

async function fetchWsTicket(): Promise<string | null> {
  try {
    let res = await authFetch("/api/ws/ticket", { method: "POST" });
    if (res.status === 401) {
      const refreshed = await authFetch("/api/auth/refresh", { method: "POST" });
      if (!refreshed.ok) return null;
      res = await authFetch("/api/ws/ticket", { method: "POST" });
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { ticket?: string };
    return data.ticket ?? null;
  } catch {
    return null;
  }
}

const EMPTY_CONTEXT: RoomContext = {
  selectedFiles: "",
  pinnedRequirements: "",
};

function createStreamingAgentMessage(runId: string, mode: AgentMode): ChatMessage {
  return {
    id: runId,
    type: "ai",
    userId: "room-agent",
    userName: "Room Agent",
    text: "",
    timestamp: new Date().toISOString(),
    mode,
    isStreaming: true,
  };
}

type UsePaircodeRoomOptions = {
  userId: string;
  userName: string;
};

export function usePaircodeRoom({ userId, userName }: UsePaircodeRoomOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const toastTimeoutsRef = useRef<number[]>([]);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [mySocketId, setMySocketId] = useState("");
  const [roomId, setRoomId] = useState("main-room");
  const [inviteToken, setInviteToken] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [activeInvite, setActiveInvite] = useState<RoomInvite | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [roomOwner, setRoomOwner] = useState<RoomOwner | null>(null);
  const [canManageRoom, setCanManageRoom] = useState(false);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [agentInput, setAgentInput] = useState("Help us split this ticket into concrete implementation tasks.");
  const [agentMode, setAgentMode] = useState<AgentMode>("answer");
  const [context, setContext] = useState<RoomContext>(EMPTY_CONTEXT);
  const [typingUsers, setTypingUsers] = useState<Record<string, RoomUser>>({});
  const [lastContextUpdateBy, setLastContextUpdateBy] = useState("");
  const [agentStreaming, setAgentStreaming] = useState(false);
  const [lastError, setLastError] = useState("");
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

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

  const activeInviteLink = useMemo(() => {
    if (!activeRoom || !activeInvite?.token || typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.origin);
    url.pathname = "/";
    url.searchParams.set("room", activeRoom);
    url.searchParams.set("invite", activeInvite.token);
    return url.toString();
  }, [activeInvite, activeRoom]);

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

  const resetRoomState = useCallback(() => {
    setStatus("idle");
    setMySocketId("");
    setActiveRoom("");
    setInviteToken("");
    setActiveInvite(null);
    setRoomMembers([]);
    setRoomOwner(null);
    setCanManageRoom(false);
    setUsers([]);
    setMessages([]);
    setMessageInput("");
    setContext(EMPTY_CONTEXT);
    setTypingUsers({});
    setLastContextUpdateBy("");
    setAgentStreaming(false);
    setLastError("");
  }, []);

  const handleConnectedPayload = useCallback((payload: Record<string, unknown>) => {
    if (typeof payload.socketId === "string") {
      setMySocketId(payload.socketId);
    }
  }, []);

  const handleRoomSnapshotPayload = useCallback((payload: Record<string, unknown>) => {
    setActiveRoom(String(payload.roomId || ""));
    setInviteToken("");
    setUsers((payload.users as RoomUser[]) || []);
    setMessages((payload.messages as ChatMessage[]) || []);
    setContext((payload.context as RoomContext) || EMPTY_CONTEXT);
    setActiveInvite((payload.activeInvite as RoomInvite | null) || null);
    setRoomMembers((payload.members as RoomMember[]) || []);
    setRoomOwner((payload.owner as RoomOwner | null) || null);
    setCanManageRoom(Boolean((payload.permissions as { canManageRoom?: boolean } | undefined)?.canManageRoom));
    setTypingUsers({});
  }, []);

  const handleInviteCreatedPayload = useCallback((payload: Record<string, unknown>) => {
    const invite = (payload.invite as RoomInvite | undefined) ?? null;
    setActiveInvite(invite);
    pushToast({
      title: "Invite link generated",
      detail: invite ? "Share the signed invite link with the next collaborator." : undefined,
      variant: "success",
    });
  }, [pushToast]);

  const handlePresencePayload = useCallback((payload: Record<string, unknown>) => {
    setUsers((payload.users as RoomUser[]) || []);
  }, []);

  const handleRoomMembersPayload = useCallback((payload: Record<string, unknown>) => {
    setRoomMembers((payload.members as RoomMember[]) || []);
  }, []);

  const handleTypingPayload = useCallback((payload: Record<string, unknown>) => {
    const user = payload.user as RoomUser;
    const isTyping = Boolean(payload.isTyping);
    setTypingUsers((previous) => {
      const next = { ...previous };
      if (isTyping) next[user.id] = user;
      else delete next[user.id];
      return next;
    });
  }, []);

  const handleChatPayload = useCallback((payload: Record<string, unknown>) => {
    const message = payload.message as ChatMessage;
    setMessages((previous) => [...previous, message]);
  }, []);

  const handleContextPayload = useCallback((payload: Record<string, unknown>) => {
    const nextContext = payload.context as RoomContext;
    setContext(nextContext);
    const updatedBy = payload.updatedBy as RoomUser;
    setLastContextUpdateBy(updatedBy?.name ?? "");
  }, []);

  const handleAiStartPayload = useCallback((payload: Record<string, unknown>) => {
    setAgentStreaming(true);
    const runId = String(payload.runId || crypto.randomUUID());
    const mode = (payload.mode as AgentMode | undefined) ?? "answer";
    const aiDraft = createStreamingAgentMessage(runId, mode);
    setMessages((previous) => [...previous.filter((message) => message.id !== runId), aiDraft]);
  }, []);

  const handleAiChunkPayload = useCallback((payload: Record<string, unknown>) => {
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
  }, []);

  const handleAiDonePayload = useCallback((payload: Record<string, unknown>) => {
    setAgentStreaming(false);
    const message = payload.message as ChatMessage;
    setMessages((previous) => previous.map((item) => (item.id === message.id ? message : item)));
  }, []);

  const handleAiErrorPayload = useCallback((payload: Record<string, unknown>) => {
    setAgentStreaming(false);
    const detail = String(payload.error || "AI failed");
    setLastError(detail);
    pushToast({
      title: detail.includes("revoked") ? "Room access revoked" : "Room action blocked",
      detail,
      variant: "danger",
    });
  }, [pushToast]);

  const handleSocketPayload = useCallback((payload: Record<string, unknown>) => {
    switch (payload.type) {
      case "connected":
        handleConnectedPayload(payload);
        break;
      case "room:snapshot":
        handleRoomSnapshotPayload(payload);
        break;
      case "presence":
        handlePresencePayload(payload);
        break;
      case "room:members":
        handleRoomMembersPayload(payload);
        break;
      case "typing":
        handleTypingPayload(payload);
        break;
      case "chat":
        handleChatPayload(payload);
        break;
      case "context":
        handleContextPayload(payload);
        break;
      case "ai:start":
        handleAiStartPayload(payload);
        break;
      case "ai:chunk":
        handleAiChunkPayload(payload);
        break;
      case "ai:done":
        handleAiDonePayload(payload);
        break;
      case "ai:error":
      case "error":
        handleAiErrorPayload(payload);
        break;
      case "invite:created":
        handleInviteCreatedPayload(payload);
        break;
      default:
        break;
    }
  }, [
    handleAiChunkPayload,
    handleAiDonePayload,
    handleAiErrorPayload,
    handleAiStartPayload,
    handleChatPayload,
    handleConnectedPayload,
    handleContextPayload,
    handlePresencePayload,
    handleRoomMembersPayload,
    handleRoomSnapshotPayload,
    handleTypingPayload,
    handleInviteCreatedPayload,
  ]);

  const handleJoin = useCallback(async (overrides?: { roomId?: string; inviteToken?: string }) => {
    const nextRoomId = (overrides?.roomId ?? roomId).trim();
    const nextUserName = userName.trim();
    const nextInviteToken = (overrides?.inviteToken ?? inviteToken).trim();

    if (!nextRoomId || !nextUserName || !userId.trim()) {
      pushToast({ title: "Authentication is required before joining a room", variant: "danger" });
      return;
    }

    const ticket = await fetchWsTicket();
    if (!ticket) {
      pushToast({ title: "Unable to obtain a realtime access ticket", variant: "danger" });
      setStatus("idle");
      return;
    }

    if (socketRef.current) {
      intentionalDisconnectRef.current = true;
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus("connecting");
    setLastError("");

    const socket = new WebSocket(buildWsUrl(ticket));
    socketRef.current = socket;
    intentionalDisconnectRef.current = false;

    socket.addEventListener("open", () => {
      if (socketRef.current !== socket) return;

      setStatus("connected");
      pushToast({ title: `Connected to ${nextRoomId}`, variant: "success" });
      socket.send(
        JSON.stringify({
          type: "join",
          roomId: nextRoomId,
          userName: nextUserName,
          inviteToken: nextInviteToken || undefined,
        })
      );
    });

    socket.addEventListener("message", (event) => {
      if (socketRef.current !== socket) return;

      const payload = JSON.parse(String(event.data)) as Record<string, unknown>;
      handleSocketPayload(payload);
    });

    socket.addEventListener("close", () => {
      if (socketRef.current !== socket) return;

      socketRef.current = null;
      const intentionalDisconnect = intentionalDisconnectRef.current;
      intentionalDisconnectRef.current = false;

      if (intentionalDisconnect) {
        resetRoomState();
        return;
      }

      setStatus("disconnected");
      setTypingUsers({});
      pushToast({ title: "Disconnected from room", variant: "danger" });
    });

    socket.addEventListener("error", () => {
      if (socketRef.current !== socket) return;

      setStatus("disconnected");
      setLastError("Failed to connect to real-time server.");
      pushToast({ title: "Connection error", detail: "Failed to reach real-time server.", variant: "danger" });
    });
  }, [handleSocketPayload, inviteToken, pushToast, resetRoomState, roomId, userId, userName]);

  const handleLeave = useCallback(() => {
    const socket = socketRef.current;
    if (!socket && !activeRoom) return;

    intentionalDisconnectRef.current = true;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "typing", isTyping: false }));
    }

    if (socket) {
      socket.close();
      socketRef.current = null;
    }

    resetRoomState();
    pushToast({ title: "Left room", variant: "default" });
  }, [activeRoom, pushToast, resetRoomState]);

  const handleSendMessage = useCallback(() => {
    if (!activeRoom) {
      pushToast({ title: "Join a room before sending messages", variant: "danger" });
      return;
    }

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
  }, [activeRoom, messageInput, pushToast, send]);

  const handleTyping = useCallback((text: string) => {
    setMessageInput(text);
    if (!activeRoom) {
      return;
    }

    send({ type: "typing", isTyping: true });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      send({ type: "typing", isTyping: false });
      typingTimeoutRef.current = null;
    }, 1200);
  }, [activeRoom, send]);

  const updateContext = useCallback((nextContext: RoomContext) => {
    setContext(nextContext);
    send({
      type: "context:update",
      context: nextContext,
    });
  }, [send]);

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

  const createInvite = useCallback(() => {
    send({ type: "invite:create" });
  }, [send]);

  const copyInviteLink = useCallback(async () => {
    if (!activeInviteLink) {
      pushToast({ title: "Generate an invite link first", variant: "danger" });
      return;
    }

    try {
      await navigator.clipboard.writeText(activeInviteLink);
      pushToast({ title: "Invite link copied", variant: "success" });
    } catch {
      pushToast({ title: "Unable to copy invite link", detail: activeInviteLink, variant: "danger" });
    }
  }, [activeInviteLink, pushToast]);

  const removeMember = useCallback((memberUserId: string, memberName: string) => {
    send({
      type: "membership:remove",
      memberUserId,
    });
    pushToast({
      title: `Removed ${memberName}`,
      detail: "Their room membership has been revoked.",
      variant: "default",
    });
  }, [pushToast, send]);

  const insertStarterMessage = useCallback(() => {
    setMessageInput("Can someone summarize the current implementation approach?");
    pushToast({ title: "Starter message inserted", variant: "default" });
  }, [pushToast]);

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

  return {
    status,
    mySocketId,
    roomId,
    setRoomId,
    name: userName,
    inviteToken,
    setInviteToken,
    activeRoom,
    activeInvite,
    activeInviteLink,
    roomMembers,
    roomOwner,
    canManageRoom,
    users,
    sortedMessages,
    messageInput,
    setMessageInput,
    agentInput,
    setAgentInput,
    agentMode,
    setAgentMode,
    context,
    lastContextUpdateBy,
    agentStreaming,
    lastError,
    toasts,
    typingIndicator,
    statusBadgeVariant,
    modeLabel,
    handleJoin,
    handleLeave,
    handleSendMessage,
    handleTyping,
    updateContext,
    askAgent,
    createInvite,
    copyInviteLink,
    removeMember,
    insertStarterMessage,
    pushToast,
  };
}