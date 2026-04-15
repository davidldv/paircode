import type { RefObject } from "react";
import { ArrowDown, MessageSquareText, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, initialsFromName, isAgentMessage, isSystemMessage, type ChatMessage } from "@/lib/paircode";

type MessagePanelProps = {
  messages: ChatMessage[];
  typingIndicator: string;
  activeRoom: string;
  messageInput: string;
  messageInputRef: RefObject<HTMLInputElement | null>;
  messageViewportRef: RefObject<HTMLDivElement | null>;
  messageEndRef: RefObject<HTMLDivElement | null>;
  onMessageInputChange: (value: string) => void;
  onMessageViewportScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  showJumpToLatest: boolean;
  onJumpToLatest: () => void;
  onSendMessage: () => void;
  onInsertStarter: () => void;
  onFocusInput: () => void;
};

export function MessagePanel({
  messages,
  typingIndicator,
  activeRoom,
  messageInput,
  messageInputRef,
  messageViewportRef,
  messageEndRef,
  onMessageInputChange,
  onMessageViewportScroll,
  showJumpToLatest,
  onJumpToLatest,
  onSendMessage,
  onInsertStarter,
  onFocusInput,
}: MessagePanelProps) {
  const canSendMessages = Boolean(activeRoom);

  return (
    <Card className="subtle-grid section-panel stage-2 flex min-h-[66vh] flex-col overflow-hidden">
      <CardHeader className="border-b border-(--panel-border)">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquareText className="h-4 w-4 text-(--accent)" /> Message Stream
            </CardTitle>
          </div>
          <div className="text-right">
            <Badge>{messages.length} items</Badge>
            <p className="mt-2 text-xs text-(--muted)">Live implementation notes, blockers, and AI guidance.</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-4 min-h-0">
        <ScrollArea className="min-h-0 flex-1 pr-2" viewportRef={messageViewportRef} onViewportScroll={onMessageViewportScroll}>
          <div className="space-y-3">
            {messages.map((message) => {
              const agentMessage = isAgentMessage(message);
              const systemMessage = isSystemMessage(message);

              if (systemMessage) {
                return (
                  <article
                    key={message.id}
                    className="border border-dashed border-[var(--panel-border)] bg-[var(--surface-strong)] px-4 py-3 text-sm shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <Badge className="border border-[var(--panel-border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl">AUDIT</Badge>
                        <span className="font-medium text-foreground">{message.userName}</span>
                      </div>
                      <span className="mono-label text-[10px]">{formatTime(message.timestamp)}</span>
                    </div>
                    <p className="mt-2 leading-6 text-foreground">{message.text}</p>
                  </article>
                );
              }

              return (
                <article
                  key={message.id}
                  className={
                    agentMessage
                      ? "border border-[var(--agent-card-border)] bg-[var(--agent-card-bg-a)] p-4 text-[var(--foreground)] shadow-sm"
                      : "border border-[var(--panel-border)] bg-[var(--surface)] p-4 shadow-sm"
                  }
                >
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[var(--muted)] border-b-2 border-[var(--panel-border)] pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-[var(--panel-border)] rounded-xl">
                        <AvatarFallback className={agentMessage ? "bg-[var(--agent-avatar-bg)] text-[var(--agent-avatar-text)] text-[10px] rounded-xl font-bold" : "bg-[var(--background)] text-[var(--foreground)] text-[10px] rounded-xl font-bold"}>
                          {initialsFromName(message.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{message.userName}</span>
                      {agentMessage ? <Badge className="border-(--agent-badge-border) bg-(--agent-badge-bg) text-(--agent-badge-text)">AI</Badge> : null}
                    </div>
                    <span className="mono-label text-[10px]">{formatTime(message.timestamp)}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">
                    {message.text || (message.isStreaming ? "..." : "")}
                  </pre>
                </article>
              );
            })}

            {messages.length === 0 ? (
              <div className="border border-dashed border-[var(--panel-border)] bg-[var(--surface-strong)] p-5 text-sm text-[var(--muted)] shadow-sm">
                <div className="section-kicker mb-3 mr-auto inline-flex bg-[var(--accent)] text-[var(--background)] font-bold px-2 py-1 uppercase tracking-wider border border-[var(--panel-border)]">Ready State</div>
                <p className="mb-2 text-base font-extrabold text-[var(--foreground)]">No messages yet. Start the conversation.</p>
                <p className="mb-4 max-w-md leading-6 font-mono text-xs">Seed the room with a summary request, implementation direction, or decision log so everyone is working from the same thread.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" className="border border-[var(--panel-border)] shadow-sm rounded-xl hover:-translate-y-0.5  hover:shadow-sm transition-all font-bold uppercase text-[10px]" onClick={onInsertStarter}>
                    Insert starter message
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="border border-transparent hover:border-[var(--panel-border)] rounded-xl font-bold uppercase text-[10px]" onClick={onFocusInput}>
                    Focus input
                  </Button>
                </div>
              </div>
            ) : null}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {showJumpToLatest ? (
          <div className="pointer-events-none -mt-2 flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onJumpToLatest}
              className="pointer-events-auto rounded-full px-4 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.55)]"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Jump to latest
            </Button>
          </div>
        ) : null}

        <div className="panel-rule" />

        <div className="composer-shell p-3">
          <div className="mb-2 h-4 font-mono text-[10px] tracking-wider text-[var(--muted)] uppercase">
            {canSendMessages ? typingIndicator || "" : "Join a room to send messages to the shared stream."}
          </div>
          <div className="flex gap-2">
            <Input
              ref={messageInputRef}
              className="flex-1 border border-[var(--panel-border)] shadow-sm focus-visible:shadow-sm focus-visible:-translate-y-0.5 focus-visible:-translate-x-0.5 transition-all text-sm rounded-xl"
              value={messageInput}
              disabled={!canSendMessages}
              onChange={(event) => onMessageInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder={canSendMessages ? "SHARE CONTEXT OR DECISIONS..." : "JOIN A ROOM TO UNLOCK STREAM..."}
            />
            <Button type="button" onClick={onSendMessage} disabled={!canSendMessages || !messageInput.trim()} className="min-w-29.5 border border-[var(--panel-border)] bg-[var(--accent)] text-[var(--background)] shadow-sm hover:shadow-sm hover:-translate-y-1  transition-all rounded-xl font-bold uppercase tracking-wider">
              <SendHorizontal className="h-4 w-4 mr-2" />
              SEND
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}