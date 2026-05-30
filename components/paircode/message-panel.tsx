import type { RefObject } from "react";
import { ArrowDown, MessageSquareText, SendHorizontal, Sparkles } from "lucide-react";

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
    <Card className="section-panel stage-2 flex min-h-[68vh] flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b border-(--panel-border) py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent)">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Message Stream</CardTitle>
            <p className="text-xs text-(--muted)">Notes, blockers, and AI guidance</p>
          </div>
        </div>
        <Badge>{messages.length} items</Badge>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4">
        <ScrollArea className="min-h-0 flex-1 pr-2" viewportRef={messageViewportRef} onViewportScroll={onMessageViewportScroll}>
          <div className="space-y-2.5">
            {messages.map((message) => {
              const agentMessage = isAgentMessage(message);
              const systemMessage = isSystemMessage(message);

              if (systemMessage) {
                return (
                  <div key={message.id} className="flex items-center gap-2.5 px-1 py-1.5 text-xs text-(--muted)">
                    <span className="h-px flex-1 bg-(--panel-border)" />
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-medium text-foreground/70">{message.userName}</span>
                      {message.text}
                      <span className="mono-label opacity-60">{formatTime(message.timestamp)}</span>
                    </span>
                    <span className="h-px flex-1 bg-(--panel-border)" />
                  </div>
                );
              }

              return (
                <article
                  key={message.id}
                  className={
                    agentMessage
                      ? "agent-card p-4"
                      : "rounded-xl border border-(--panel-border) bg-(--surface) p-4 transition-colors hover:border-(--panel-border-strong)"
                  }
                >
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback
                          className={
                            agentMessage
                              ? "bg-(--agent-avatar-bg) text-[10px] font-semibold text-(--agent-avatar-text)"
                              : "text-[10px] font-semibold"
                          }
                        >
                          {agentMessage ? <Sparkles className="h-3.5 w-3.5" /> : initialsFromName(message.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{message.userName}</span>
                      {agentMessage ? (
                        <span className="rounded-full bg-(--agent-badge-bg) px-2 py-0.5 text-[10px] font-semibold text-(--agent-badge-text)">
                          AI
                        </span>
                      ) : null}
                    </div>
                    <span className="mono-label text-[11px] text-(--muted)">{formatTime(message.timestamp)}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {message.text || (message.isStreaming ? "…" : "")}
                  </pre>
                </article>
              );
            })}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-(--panel-border) bg-(--surface-strong)/40 px-6 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent-tint) text-(--accent)">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-foreground">No messages yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-(--muted)">
                  Seed the room with a summary request, implementation direction, or decision log so everyone works
                  from the same thread.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" onClick={onInsertStarter}>
                    Insert starter message
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={onFocusInput}>
                    Focus input
                  </Button>
                </div>
              </div>
            ) : null}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {showJumpToLatest ? (
          <div className="pointer-events-none -mt-1 flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onJumpToLatest}
              className="pointer-events-auto rounded-full px-4 shadow-md"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Jump to latest
            </Button>
          </div>
        ) : null}

        <div>
          <div className="mb-1.5 h-4 px-1 text-xs text-(--muted)">
            {canSendMessages ? typingIndicator || "" : "Join a room to send messages to the shared stream."}
          </div>
          <div className="composer-shell flex items-center gap-2 p-2">
            <Input
              ref={messageInputRef}
              className="h-10 flex-1 border-transparent bg-transparent shadow-none hover:border-transparent focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0"
              value={messageInput}
              disabled={!canSendMessages}
              onChange={(event) => onMessageInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder={canSendMessages ? "Share context or decisions…" : "Join a room to unlock the stream…"}
            />
            <Button
              type="button"
              onClick={onSendMessage}
              disabled={!canSendMessages || !messageInput.trim()}
              className="h-10 shrink-0"
            >
              <SendHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
