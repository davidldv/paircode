export type RoomRole = "owner" | "collaborator" | "viewer";

export type RoomUser = {
  id: string;
  name: string;
  userId?: string;
};

export type RoomOwner = {
  userId: string;
  name: string;
};

export type RoomMember = {
  userId: string;
  name: string;
  role: RoomRole;
};

export type RoomInvite = {
  token: string;
  expiresAt: string;
};

export type AuditMetadata = {
  kind:
    | "room-created"
    | "invite-rotated"
    | "member-added"
    | "member-removed"
    | "member-role-updated";
  actorName?: string;
  actorUserId?: string;
  targetName?: string;
  targetUserId?: string;
  role?: RoomRole;
};

export type RoomContext = {
  selectedFiles: string;
  pinnedRequirements: string;
};

export type ChatMessage = {
  id: string;
  type: "chat" | "ai" | "system";
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  mode?: "answer" | "summarize" | "next-steps";
  isStreaming?: boolean;
  auditMetadata?: AuditMetadata;
};

export type AgentMode = "answer" | "summarize" | "next-steps";

export type ToastNotice = {
  id: string;
  title: string;
  detail?: string;
  variant?: "default" | "success" | "danger";
};

export function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initialsFromName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "??";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function isAgentMessage(message: ChatMessage) {
  return message.userId === "room-agent" || message.type === "ai";
}

export function isSystemMessage(message: ChatMessage) {
  return message.type === "system" || message.userId === "room-audit";
}