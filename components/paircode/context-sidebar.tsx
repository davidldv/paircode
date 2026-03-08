import type { RefObject } from "react";
import { Bot, CheckCircle2, FolderTree, LoaderCircle, Pin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { type AgentMode, type RoomContext } from "@/lib/paircode";

type ContextSidebarProps = {
  context: RoomContext;
  lastContextUpdateBy: string;
  agentInput: string;
  agentMode: AgentMode;
  agentStreaming: boolean;
  lastError: string;
  agentInputRef: RefObject<HTMLTextAreaElement | null>;
  onContextChange: (nextContext: RoomContext) => void;
  onAgentInputChange: (value: string) => void;
  onSelectMode: (mode: AgentMode) => void;
  onRunAgent: (mode: AgentMode) => void;
};

export function ContextSidebar({
  context,
  lastContextUpdateBy,
  agentInput,
  agentMode,
  agentStreaming,
  lastError,
  agentInputRef,
  onContextChange,
  onAgentInputChange,
  onSelectMode,
  onRunAgent,
}: ContextSidebarProps) {
  return (
    <aside className="space-y-4">
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
            onChange={(event) => onContextChange({ ...context, selectedFiles: event.target.value })}
            placeholder="src/app/page.tsx\nsrc/lib/realtime.ts"
          />

          <label className="mono-label mb-1 block text-[10px] text-(--muted)">Pinned requirements</label>
          <Textarea
            className="h-24"
            value={context.pinnedRequirements}
            onChange={(event) => onContextChange({ ...context, pinnedRequirements: event.target.value })}
            placeholder="Must support optimistic updates and strict TypeScript."
          />

          {lastContextUpdateBy ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-(--muted)">
              <Pin className="h-3.5 w-3.5" /> Updated by {lastContextUpdateBy}
            </p>
          ) : null}
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
              disabled={agentStreaming}
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
              disabled={agentStreaming}
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
              disabled={agentStreaming}
            >
              Next Steps
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] p-3">
            <div className="flex items-center gap-2 text-xs text-(--muted)">
              {agentStreaming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-(--success)" />}
              <span>{agentStreaming ? "Room Agent is streaming..." : "Room Agent is ready"}</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-(--muted)">Tip: place focus in this box and press Ctrl/Cmd+Enter to run the selected mode.</p>
          </div>
          {lastError ? <p className="mt-2 text-xs text-[#b03a2e]">{lastError}</p> : null}
        </CardContent>
      </Card>
    </aside>
  );
}