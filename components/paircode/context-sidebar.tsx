import type { RefObject } from "react";
import { Bot, CheckCircle2, FolderTree, LoaderCircle, LockKeyhole, Pin, Sparkles } from "lucide-react";

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
    <aside className="space-y-4">
      <Card className="section-panel stage-2">
        <CardHeader>
          <div className="section-kicker">Room Access</div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LockKeyhole className="h-4 w-4 text-(--accent)" /> Membership Control
          </CardTitle>
          <CardDescription className="leading-6">Existing rooms require explicit membership. Owners issue signed invite links and invited operators become persistent members after their first successful join.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] p-3 text-sm text-(--muted)">
            {activeRoom
              ? canManageRoom
                ? "You own this room. Generate an invite link whenever you need to grant access to another authenticated collaborator."
                : "You are in this restricted room as a member. Once a join succeeds, future access no longer requires reopening the invite link."
              : "Join a room first. New rooms are created under your ownership; existing rooms require a valid invite link unless you are already a member."}
          </div>

          {canManageRoom ? (
            <Button type="button" variant="secondary" className="mt-3 w-full" onClick={onCreateInvite} disabled={!activeRoom}>
              <LockKeyhole className="h-4 w-4" /> {activeInvite ? "Rotate Invite Link" : "Generate Invite Link"}
            </Button>
          ) : null}

          {activeInvite ? (
            <div className="mt-3 rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] p-3">
              <p className="mono-label text-[10px] text-(--muted)">Active invite link</p>
              <p className="mt-2 break-all text-xs leading-6 text-foreground">{activeInviteLink || "Invite link will appear here after generation."}</p>
              <p className="mt-1 text-xs text-(--muted)">Expires {new Date(activeInvite.expiresAt).toLocaleString()}</p>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={onCopyInviteLink}>
                <LockKeyhole className="h-4 w-4" /> Copy Invite Link
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-3">
        <CardHeader>
          <div className="section-kicker">Source Of Truth</div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderTree className="h-4 w-4 text-(--accent)" /> Shared Context
          </CardTitle>
          <CardDescription className="leading-6">Keep everyone aligned with selected code and immutable constraints.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="mono-label mb-1 block text-[10px] text-(--muted)">Selected files or snippets</label>
          <Textarea
            className="mb-3 h-24"
            value={context.selectedFiles}
            disabled={!canManageRoom}
            onChange={(event) => onContextChange({ ...context, selectedFiles: event.target.value })}
            placeholder="src/app/page.tsx\nsrc/lib/realtime.ts"
          />

          <label className="mono-label mb-1 block text-[10px] text-(--muted)">Pinned requirements</label>
          <Textarea
            className="h-24"
            value={context.pinnedRequirements}
            disabled={!canManageRoom}
            onChange={(event) => onContextChange({ ...context, pinnedRequirements: event.target.value })}
            placeholder="Must support optimistic updates and strict TypeScript."
          />

          {roomOwner ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-(--muted)">
              <LockKeyhole className="h-3.5 w-3.5" /> Room owner: {roomOwner.name}
            </p>
          ) : null}

          {lastContextUpdateBy ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-(--muted)">
              <Pin className="h-3.5 w-3.5" /> Updated by {lastContextUpdateBy}
            </p>
          ) : null}

          {!canManageRoom ? <p className="mt-2 text-xs text-(--muted)">Only the room owner can edit shared context.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-4">
        <CardHeader>
          <div className="section-kicker">Copilot Workspace Operator</div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-(--accent)" /> Room Agent
          </CardTitle>
          <CardDescription className="leading-6">Ask, summarize, and generate practical next steps from room context.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            ref={agentInputRef}
            className="h-32"
            value={agentInput}
            disabled={!canManageRoom}
            onChange={(event) => onAgentInputChange(event.target.value)}
            placeholder="Ask the room agent a question..."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={agentMode === "answer" ? "default" : "secondary"}
              type="button"
              onClick={() => {
                onSelectMode("answer");
                onRunAgent("answer");
              }}
              disabled={agentStreaming || !canManageRoom}
            >
              <Bot className="h-4 w-4" /> Ask
            </Button>
            <Button
              variant={agentMode === "summarize" ? "default" : "secondary"}
              type="button"
              onClick={() => {
                onSelectMode("summarize");
                onRunAgent("summarize");
              }}
              disabled={agentStreaming || !canManageRoom}
            >
              Summarize
            </Button>
            <Button
              variant={agentMode === "next-steps" ? "default" : "secondary"}
              type="button"
              onClick={() => {
                onSelectMode("next-steps");
                onRunAgent("next-steps");
              }}
              disabled={agentStreaming || !canManageRoom}
            >
              Next Steps
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] p-3">
            <div className="flex items-center gap-2 text-xs text-(--muted)">
              {agentStreaming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-(--success)" />}
              <span>
                {agentStreaming
                  ? "Room Agent is streaming..."
                  : canManageRoom
                    ? "Room Agent is ready"
                    : "Room Agent is owner-controlled"}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-(--muted)">Tip: place focus in this box and press Ctrl/Cmd+Enter to run the selected mode.</p>
          </div>
          {lastError ? <p className="mt-2 text-xs text-[#b03a2e]">{lastError}</p> : null}
        </CardContent>
      </Card>
    </aside>
  );
}