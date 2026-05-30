import type { RefObject } from "react";
import { Bot, CheckCircle2, Copy, FolderTree, LoaderCircle, LockKeyhole, Pin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type AgentMode, type RoomContext, type RoomInvite, type RoomOwner } from "@/lib/paircode";

type ContextSidebarProps = {
  context: RoomContext;
  activeRoom: string;
  activeInvite: RoomInvite | null;
  activeInviteLink: string;
  roomOwner: RoomOwner | null;
  canManageRoom: boolean;
  lastContextUpdateBy: string;
  agentInput: string;
  agentMode: AgentMode;
  agentStreaming: boolean;
  lastError: string;
  agentInputRef: RefObject<HTMLTextAreaElement | null>;
  onContextChange: (nextContext: RoomContext) => void;
  onCreateInvite: () => void;
  onCopyInviteLink: () => void;
  onAgentInputChange: (value: string) => void;
  onSelectMode: (mode: AgentMode) => void;
  onRunAgent: (mode: AgentMode) => void;
};

const AGENT_MODES: { mode: AgentMode; label: string }[] = [
  { mode: "answer", label: "Ask" },
  { mode: "summarize", label: "Summarize" },
  { mode: "next-steps", label: "Steps" },
];

export function ContextSidebar({
  context,
  activeRoom,
  activeInvite,
  activeInviteLink,
  roomOwner,
  canManageRoom,
  lastContextUpdateBy,
  agentInput,
  agentMode,
  agentStreaming,
  lastError,
  agentInputRef,
  onContextChange,
  onCreateInvite,
  onCopyInviteLink,
  onAgentInputChange,
  onSelectMode,
  onRunAgent,
}: ContextSidebarProps) {
  return (
    <aside className="space-y-5">
      {/* Membership control */}
      <Card className="section-panel stage-2 overflow-hidden">
        <CardHeader className="border-b border-(--panel-border) py-4">
          <CardTitle className="flex items-center gap-2.5 text-[15px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent)">
              <LockKeyhole className="h-4 w-4" />
            </span>
            Membership Control
          </CardTitle>
          <CardDescription>
            Existing rooms require explicit membership. Owners issue signed invite links; invited operators become
            persistent members after their first successful join.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <p className="surface-inset p-3 text-sm leading-relaxed text-(--muted)">
            {activeRoom
              ? canManageRoom
                ? "You own this room. Generate an invite link whenever you need to grant access to another authenticated collaborator."
                : "You are in this restricted room as a member. Once a join succeeds, future access no longer requires reopening the invite link."
              : "Join a room first. New rooms are created under your ownership; existing rooms require a valid invite link unless you are already a member."}
          </p>

          {canManageRoom ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              onClick={onCreateInvite}
              disabled={!activeRoom}
            >
              <LockKeyhole className="h-4 w-4" /> {activeInvite ? "Rotate invite link" : "Generate invite link"}
            </Button>
          ) : null}

          {activeInvite ? (
            <div className="surface-inset mt-4 p-4">
              <p className="mono-label text-[11px] font-medium uppercase tracking-wide text-(--accent)">
                Active invite link
              </p>
              <p className="mt-2 break-all font-mono text-xs leading-relaxed text-foreground">
                {activeInviteLink || "Invite link will appear here after generation."}
              </p>
              <p className="mt-2 text-xs text-(--muted)">
                Expires {new Date(activeInvite.expiresAt).toLocaleString()}
              </p>
              <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={onCopyInviteLink}>
                <Copy className="h-3.5 w-3.5" /> Copy invite link
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Shared context */}
      <Card className="section-panel stage-3">
        <CardHeader className="border-b border-(--panel-border) py-4">
          <CardTitle className="flex items-center gap-2.5 text-[15px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent)">
              <FolderTree className="h-4 w-4" />
            </span>
            Shared Context
          </CardTitle>
          <CardDescription>Keep everyone aligned with selected code and immutable constraints.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <label className="mb-2 block text-xs font-medium text-foreground">Selected files or snippets</label>
          <Textarea
            className="mb-4 h-24 font-mono text-[13px]"
            value={context.selectedFiles}
            disabled={!canManageRoom}
            onChange={(event) => onContextChange({ ...context, selectedFiles: event.target.value })}
            placeholder={"src/app/page.tsx\nsrc/lib/realtime.ts"}
          />

          <label className="mb-2 block text-xs font-medium text-foreground">Pinned requirements</label>
          <Textarea
            className="h-24 text-[13px]"
            value={context.pinnedRequirements}
            disabled={!canManageRoom}
            onChange={(event) => onContextChange({ ...context, pinnedRequirements: event.target.value })}
            placeholder="Must support optimistic updates and strict TypeScript."
          />

          {roomOwner ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-(--muted)">
              <LockKeyhole className="h-3.5 w-3.5" /> Room owner: {roomOwner.name}
            </p>
          ) : null}

          {lastContextUpdateBy ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-(--muted)">
              <Pin className="h-3.5 w-3.5" /> Updated by {lastContextUpdateBy}
            </p>
          ) : null}

          {!canManageRoom ? (
            <p className="mt-3 text-xs text-(--muted)">Only the room owner can edit shared context.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Room agent */}
      <Card className="section-panel stage-4 overflow-hidden">
        <CardHeader className="border-b border-(--agent-card-border) bg-(--agent-card-bg) py-4">
          <CardTitle className="flex items-center gap-2.5 text-[15px] text-(--accent)">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent) text-(--accent-contrast)">
              <Sparkles className="h-4 w-4" />
            </span>
            Room Agent
          </CardTitle>
          <CardDescription>Ask, summarize, and generate practical next steps from room context.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <Textarea
            ref={agentInputRef}
            className="h-28 text-[13px]"
            value={agentInput}
            disabled={!canManageRoom}
            onChange={(event) => onAgentInputChange(event.target.value)}
            placeholder="Ask the room agent a question…"
          />

          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-(--panel-border) bg-(--surface-strong) p-1">
            {AGENT_MODES.map(({ mode, label }) => {
              const active = agentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode);
                    onRunAgent(mode);
                  }}
                  disabled={agentStreaming || !canManageRoom}
                  className={
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 " +
                    (active
                      ? "bg-(--accent) text-(--accent-contrast) shadow-sm"
                      : "text-(--muted) hover:bg-(--surface) hover:text-foreground")
                  }
                >
                  {mode === "answer" ? <Bot className="h-3.5 w-3.5" /> : null}
                  {label}
                </button>
              );
            })}
          </div>

          <div className="surface-inset mt-4 flex items-center gap-2 p-3 text-sm">
            {agentStreaming ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-(--accent)" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-(--success)" />
            )}
            <span className="font-medium text-foreground">
              {agentStreaming ? "Agent is working…" : canManageRoom ? "Agent ready" : "Agent — owner only"}
            </span>
            <span className="ml-auto hidden text-xs text-(--muted) sm:inline">⌘ / Ctrl + ↵</span>
          </div>

          {lastError ? (
            <p className="mt-3 rounded-lg bg-(--danger-tint) px-3 py-2 text-xs text-(--danger)">{lastError}</p>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
}
