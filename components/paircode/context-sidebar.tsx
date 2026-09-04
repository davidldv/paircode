import type { RefObject } from "react";
import { Copy, LoaderCircle, LockKeyhole, RotateCw, Sparkles } from "lucide-react";

import { IdentityPanel } from "@/components/paircode/identity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ROOM_AGENT_ID,
  type AgentMode,
  type RoomContext,
  type RoomInvite,
  type RoomOwner,
} from "@/lib/paircode";
import { cn } from "@/lib/utils";

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
  { mode: "next-steps", label: "Next steps" },
];

/** Chevron-pad the real token into fixed courses, as a travel document does. */
function machineReadable(token: string, width = 30) {
  const lines: string[] = [];
  for (let i = 0; i < token.length; i += width) {
    lines.push(token.slice(i, i + width).padEnd(width, "<"));
  }
  return lines.length ? lines : ["<".repeat(width)];
}

/**
 * The issuing desk: where a pass is printed, where the room's standing
 * requirements are countersigned, and where the machine-issued agent is asked
 * to work. Everything an owner alone may do says so on the control itself.
 */
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
    <aside className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      {/* ---- The pass ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Issuing desk</CardTitle>
          {canManageRoom ? (
            <span className="legend ml-auto text-(--secure-ink)/75">Owner</span>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-[0.8125rem] leading-relaxed text-(--ink-2)">
            {activeRoom
              ? canManageRoom
                ? "You own this room. Issue a pass to grant access to another authenticated collaborator."
                : "You hold a member credential for this room. Once a join succeeds, future access no longer requires reopening the invite link."
              : "Join a room first. New rooms are created under your ownership; existing rooms require a valid pass unless you are already enrolled."}
          </p>

          {canManageRoom ? (
            <Button
              type="button"
              variant={activeInvite ? "secondary" : "default"}
              className="w-full"
              onClick={onCreateInvite}
              disabled={!activeRoom}
            >
              {activeInvite ? (
                <RotateCw className="h-3.5 w-3.5" />
              ) : (
                <LockKeyhole className="h-3.5 w-3.5" />
              )}
              {activeInvite ? "Rotate pass" : "Issue pass"}
            </Button>
          ) : null}

          {activeInvite ? (
            <article className="credential print-in overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-(--secure-deep) bg-(--secure) px-2.5 py-1 text-(--secure-ink)">
                <span className="legend text-(--secure-ink)">Room pass</span>
                <span className="value text-[0.6875rem] uppercase tracking-[0.08em]">
                  {activeRoom}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-2.5 py-2.5">
                <div className="col-span-2">
                  <dt className="legend">Issued to</dt>
                  <dd className="value text-[0.8125rem] text-(--ink-2)">
                    first operator to present it
                  </dd>
                </div>
                <div>
                  <dt className="legend">Issued by</dt>
                  <dd className="value truncate text-[0.8125rem] text-(--ink)">
                    {roomOwner?.name ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="legend">Expires</dt>
                  <dd className="value text-[0.8125rem] text-(--ink)">
                    {new Date(activeInvite.expiresAt).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              </dl>

              <div className="mrz" aria-label="Signed invite token">
                {machineReadable(activeInvite.token).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-(--rule) bg-(--stock-rack) px-2.5 py-2">
                <span className="note flex-1 truncate">
                  {activeInviteLink || "Link appears after issue."}
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={onCopyInviteLink}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
            </article>
          ) : null}
        </CardContent>
      </Card>

      {/* ---- The countersigned sheet ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Standing context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label htmlFor="context-files" className="legend mb-1 block">
              Selected files or snippets
            </label>
            <div className={cn(canManageRoom ? undefined : "overprint")} data-overprint="Owner only">
              <Textarea
                id="context-files"
                className="value h-24 text-[0.8125rem]"
                value={context.selectedFiles}
                disabled={!canManageRoom}
                onChange={(event) =>
                  onContextChange({ ...context, selectedFiles: event.target.value })
                }
                placeholder={"src/app/page.tsx\nsrc/lib/realtime.ts"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="context-requirements" className="legend mb-1 block">
              Pinned requirements
            </label>
            <div className={cn(canManageRoom ? undefined : "overprint")} data-overprint="Owner only">
              <Textarea
                id="context-requirements"
                className="h-24 text-[0.8125rem]"
                value={context.pinnedRequirements}
                disabled={!canManageRoom}
                onChange={(event) =>
                  onContextChange({ ...context, pinnedRequirements: event.target.value })
                }
                placeholder="Must support optimistic updates and strict TypeScript."
              />
            </div>
          </div>

          {/* Countersignature: who last put their hand to this sheet. */}
          <div className="border-t border-(--rule) pt-2">
            <span className="legend">Countersigned</span>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="value text-[0.8125rem] text-(--ink)">
                {lastContextUpdateBy || roomOwner?.name || "—"}
              </span>
              {roomOwner ? (
                <span className="note">room owner — {roomOwner.name}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- The machine-issued credential ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Room agent</CardTitle>
          <span className="legend ml-auto text-(--secure-ink)/75">Machine issued</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2.5">
            <IdentityPanel seed={ROOM_AGENT_ID} name="AI" machine />
            <p className="text-[0.8125rem] leading-relaxed text-(--ink-2)">
              Holds a machine credential scoped to this room. It reads the standing context above and
              writes its answer into the register.
            </p>
          </div>

          <div className={cn(canManageRoom ? undefined : "overprint")} data-overprint="Owner only">
            <Textarea
              ref={agentInputRef}
              className="h-24 text-[0.8125rem]"
              value={agentInput}
              disabled={!canManageRoom}
              onChange={(event) => onAgentInputChange(event.target.value)}
              placeholder="Ask the room agent a question…"
              aria-label="Request to the room agent"
            />
          </div>

          <div className="grid grid-cols-3 gap-px border border-(--rule-strong) bg-(--rule-strong)">
            {AGENT_MODES.map(({ mode, label }) => {
              const active = agentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onSelectMode(mode);
                    onRunAgent(mode);
                  }}
                  disabled={agentStreaming || !canManageRoom}
                  className={cn(
                    "flex h-8 items-center justify-center px-1 text-[0.6875rem] font-[600] uppercase tracking-[0.09em] transition-colors duration-100 [font-stretch:78%] disabled:opacity-45",
                    active
                      ? "bg-(--secure) text-(--secure-ink)"
                      : "bg-(--stock-face) text-(--ink-2) hover:bg-(--stock-rack) hover:text-(--ink)"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "relative flex items-center gap-2 overflow-hidden border border-(--rule) bg-(--stock-sunk) px-2.5 py-2",
              agentStreaming && "reader-sweep"
            )}
          >
            {agentStreaming ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-(--secure)" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-(--secure)" />
            )}
            <span className="text-[0.75rem] font-[600] text-(--ink)">
              {agentStreaming
                ? "Agent is working…"
                : canManageRoom
                  ? "Agent ready"
                  : "Agent — owner only"}
            </span>
            <span className="legend ml-auto hidden sm:inline">⌘ / Ctrl + ↵</span>
          </div>

          {lastError ? (
            <p className="border border-(--cancel) bg-(--cancel-tint) px-2.5 py-2 text-[0.75rem] leading-relaxed text-(--cancel)">
              <span className="legend mr-1.5 text-(--cancel)">Refused</span>
              {lastError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
}
