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
    <aside className="space-y-6">
      <Card className="section-panel stage-2 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--accent) text-(--background)">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
            <LockKeyhole className="h-5 w-5" /> Membership Control
          </CardTitle>
          <CardDescription className="leading-6 font-mono text-xs text-(--background) opacity-90">Existing rooms require explicit membership. Owners issue signed invite links and invited operators become persistent members after their first successful join.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border border-(--panel-border) bg-(--surface-strong) p-3 text-sm text-foreground font-mono shadow-sm">
            {activeRoom
              ? canManageRoom
                ? "You own this room. Generate an invite link whenever you need to grant access to another authenticated collaborator."
                : "You are in this restricted room as a member. Once a join succeeds, future access no longer requires reopening the invite link."
              : "Join a room first. New rooms are created under your ownership; existing rooms require a valid invite link unless you are already a member."}
          </div>

          {canManageRoom ? (
            <Button type="button" variant="secondary" className="mt-4 w-full border border-(--panel-border) bg-(--surface) text-foreground shadow-sm hover:shadow-sm hover:-translate-y-1  transition-all rounded-xl font-bold uppercase tracking-wider" onClick={onCreateInvite} disabled={!activeRoom}>
              <LockKeyhole className="h-4 w-4 mr-2" /> {activeInvite ? "Rotate Invite Link" : "Generate Invite Link"}
            </Button>
          ) : null}

          {activeInvite ? (
            <div className="mt-4 border border-(--panel-border) bg-(--surface-strong) p-4 shadow-sm relative">
              <span className="absolute -top-3 left-3 bg-(--accent) text-(--background) font-bold text-[10px] px-2 py-0.5 border border-(--panel-border) uppercase tracking-widest">Active invite link</span>
              <p className="mt-2 break-all text-xs leading-6 text-foreground font-mono">{activeInviteLink || "Invite link will appear here after generation."}</p>
              <p className="mt-2 text-xs text-(--muted) font-mono font-bold">EXPIRES {new Date(activeInvite.expiresAt).toLocaleString()}</p>
              <Button type="button" variant="ghost" size="sm" className="mt-4 w-full border border-(--panel-border) bg-(--surface) shadow-sm hover:-translate-y-0.5  hover:shadow-sm rounded-xl font-bold uppercase" onClick={onCopyInviteLink}>
                <LockKeyhole className="h-4 w-4 mr-2" /> Copy Invite Link
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-3 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--surface-strong)">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-foreground">
            <FolderTree className="h-5 w-5 text-(--accent)" /> Shared Context
          </CardTitle>
          <CardDescription className="leading-6 font-mono text-xs text-(--muted)">Keep everyone aligned with selected code and immutable constraints.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground">Selected files or snippets</label>
          <Textarea
            className="mb-4 h-24 border border-(--panel-border) rounded-xl shadow-sm focus-visible:shadow-sm focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 transition-all font-mono text-sm"
            value={context.selectedFiles}
            disabled={!canManageRoom}
            onChange={(event) => onContextChange({ ...context, selectedFiles: event.target.value })}
            placeholder="src/app/page.tsx&#10;src/lib/realtime.ts"
          />

          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground">Pinned requirements</label>
          <Textarea
            className="h-24 border border-(--panel-border) rounded-xl shadow-sm focus-visible:shadow-sm focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 transition-all font-mono text-sm"
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

      <Card className="section-panel stage-4 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--agent-card-border) text-(--background)">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-(--background)">
            <Sparkles className="h-5 w-5" /> Room Agent
          </CardTitle>
          <CardDescription className="leading-6 font-mono text-(--background) opacity-90 text-xs">Ask, summarize, and generate practical next steps from room context.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Textarea
            ref={agentInputRef}
            className="h-32 border border-(--panel-border) rounded-xl shadow-sm focus-visible:shadow-sm focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 transition-all font-mono text-sm"
            value={agentInput}
            disabled={!canManageRoom}
            onChange={(event) => onAgentInputChange(event.target.value)}
            placeholder="Ask the room agent a question..."
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              className={`flex-1 border border-(--panel-border) rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all hover:-translate-y-0.5  ${agentMode === "answer" ? "bg-(--agent-card-border) text-(--background) shadow-sm" : "bg-(--surface-strong) text-foreground hover:shadow-sm"}`}
              type="button"
              onClick={() => {
                onSelectMode("answer");
                onRunAgent("answer");
              }}
              disabled={agentStreaming || !canManageRoom}
            >
              <Bot className="h-3.5 w-3.5 mr-1" /> Ask
            </Button>
            <Button
              className={`flex-1 border border-(--panel-border) rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all hover:-translate-y-0.5  ${agentMode === "summarize" ? "bg-(--agent-card-border) text-(--background) shadow-sm" : "bg-(--surface-strong) text-foreground hover:shadow-sm"}`}
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
              className={`flex-1 border border-(--panel-border) rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all hover:-translate-y-0.5  ${agentMode === "next-steps" ? "bg-(--agent-card-border) text-(--background) shadow-sm" : "bg-(--surface-strong) text-foreground hover:shadow-sm"}`}
              type="button"
              onClick={() => {
                onSelectMode("next-steps");
                onRunAgent("next-steps");
              }}
              disabled={agentStreaming || !canManageRoom}
            >
              Steps
            </Button>
          </div>

          <div className="mt-5 border border-(--panel-border) bg-(--surface) p-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              {agentStreaming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-(--success)" />}
              <span>
                {agentStreaming
                  ? "AGENT ACTIVE..."
                  : canManageRoom
                    ? "AGENT READY"
                    : "AGENT: OWNER ONLY"}
              </span>
            </div>
            <p className="mt-2 text-[10px] uppercase font-mono tracking-wide leading-5 text-(--muted)">TIP: FOCUS BOX + CTRL/CMD+ENTER</p>
          </div>
          {lastError ? <p className="mt-2 text-xs text-[#b03a2e]">{lastError}</p> : null}
        </CardContent>
      </Card>
    </aside>
  );
}