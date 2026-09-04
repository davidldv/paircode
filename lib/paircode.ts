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

/**
 * A guest session is a real, provisional credential and the interface bands it
 * as one. The shape below mirrors exactly what app/api/auth/guest/route.ts
 * mints; if that route ever changes its address format, change this with it.
 * A dedicated column or token claim would be sturdier than a pattern match.
 */
const GUEST_EMAIL = /^guest-[0-9a-f]+@example\.com$/i;

export function isGuestOperator(email: string | undefined | null) {
  return Boolean(email && GUEST_EMAIL.test(email.trim()));
}

/** The machine credential's identity. Every guilloché of the agent is
 *  engraved from this, exactly as a person's is engraved from their user id. */
export const ROOM_AGENT_ID = "room-agent";

export function isAgentMessage(message: ChatMessage) {
  return message.userId === ROOM_AGENT_ID || message.type === "ai";
}

export function isSystemMessage(message: ChatMessage) {
  return message.type === "system" || message.userId === "room-audit";
}