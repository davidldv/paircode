export type RoomUser = {
  id: string;
  name: string;
};

export type RoomContext = {
  selectedFiles: string;
  pinnedRequirements: string;
};

export type ChatMessage = {
  id: string;
  type: "chat" | "ai";
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  mode?: "answer" | "summarize" | "next-steps";
  isStreaming?: boolean;
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