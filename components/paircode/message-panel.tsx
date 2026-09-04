import type { RefObject } from "react";
import { ArrowDown, SendHorizontal } from "lucide-react";

import { IdentityChip } from "@/components/paircode/identity";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, isAgentMessage, isSystemMessage, type ChatMessage } from "@/lib/paircode";

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

/**
 * The access register: every entry the room made, in the order the server
 * recorded it. Joins, denials and link changes print here as records rather
 * than living only in a toast that scrolls away.
 */
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
    <Card className="flex min-h-[70vh] flex-col overflow-hidden lg:h-full lg:min-h-0">
      <CardHeader>
        <CardTitle>Access register</CardTitle>
        <span className="legend ml-auto text-(--secure-ink)/75">
          {String(messages.length).padStart(3, "0")} entries
        </span>
      </CardHeader>

      {/* Column heads, printed once on the blank. */}
      <div className="flex items-center gap-3 border-b border-(--rule) bg-(--stock-rack) px-3 py-1">
        <span className="legend w-16 shrink-0">Time</span>
        <span className="legend">Bearer and entry</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea
          className="min-h-0 flex-1"
          viewportRef={messageViewportRef}
          onViewportScroll={onMessageViewportScroll}
        >
          {messages.map((message) => {
            const agentMessage = isAgentMessage(message);

            if (isSystemMessage(message)) {
              return (
                <div
                  key={message.id}
                  className="flex items-center gap-3 border-b border-(--rule) bg-(--stock-rack) px-3 py-1.5"
                >
                  <span className="value w-16 shrink-0 whitespace-nowrap text-[0.6875rem] text-(--ink-3)">
                    {formatTime(message.timestamp)}
                  </span>
                  <span className="flex-1 text-[0.75rem] leading-snug text-(--ink-2)">
                    <span className="legend mr-1.5">{message.userName}</span>
                    {message.text}
                  </span>
                  {message.auditMetadata?.kind === "member-removed" ? (
                    <span className="stamp shrink-0">Revoked</span>
                  ) : null}
                </div>
              );
            }

            return (
              <article key={message.id} className="log-row flex gap-3">
                <span className="value w-16 shrink-0 whitespace-nowrap pt-0.5 text-[0.6875rem] text-(--ink-3)">
                  {formatTime(message.timestamp)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <IdentityChip
                      seed={message.userId}
                      name={agentMessage ? "AI" : message.userName}
                      machine={agentMessage}
                    />
                    <span className="text-[0.8125rem] font-[600] text-(--ink)">
                      {message.userName}
                    </span>
                    {agentMessage ? (
                      <span className="legend rounded-[2px] bg-(--secure) px-1.5 py-px text-(--secure-ink)">
                        Machine issued
                      </span>
                    ) : null}
                  </div>

                  {agentMessage ? (
                    <div className="mt-2 border border-(--rule-strong) bg-(--secure-wash) px-3 py-2.5">
                      <pre className="whitespace-pre-wrap font-sans text-[0.875rem] leading-[1.65] text-(--ink)">
                        {message.text || (message.isStreaming ? "▍" : "")}
                      </pre>
                    </div>
                  ) : (
                    <pre className="mt-1.5 whitespace-pre-wrap pl-8 font-sans text-[0.875rem] leading-[1.65] text-(--ink)">
                      {message.text || (message.isStreaming ? "▍" : "")}
                    </pre>
                  )}
                </div>
              </article>
            );
          })}

          {messages.length === 0 ? (
            <div className="px-3 py-10">
              {/* A blank register: ruled courses waiting to be filled. */}
              <div className="mx-auto max-w-md">
                <div className="border border-(--rule) bg-(--stock-sunk)">
                  {[0, 1, 2, 3].map((line) => (
                    <div
                      key={line}
                      className="flex items-center gap-3 border-b border-(--rule) px-3 py-2 last:border-b-0"
                    >
                      <span className="value w-16 shrink-0 text-[0.6875rem] text-(--ink-3)/50">--:--</span>
                      <span className="h-px flex-1 bg-(--rule)" />
                    </div>
                  ))}
                </div>
                <p className="legend mt-4 text-center">No entries recorded</p>
                <p className="mt-2 text-center text-[0.8125rem] leading-relaxed text-(--ink-2)">
                  Seed the room with a summary request, implementation direction, or decision log so
                  everyone works from the same thread.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" onClick={onInsertStarter}>
                    Insert starter entry
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={onFocusInput}>
                    Focus entry field
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <div ref={messageEndRef} />
        </ScrollArea>

        {showJumpToLatest ? (
          <div className="pointer-events-none flex justify-center border-t border-(--rule) py-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onJumpToLatest}
              className="pointer-events-auto"
            >
              <ArrowDown className="h-3 w-3" />
              Jump to latest
            </Button>
          </div>
        ) : null}

        {/* The entry line. */}
        <div className="border-t border-(--rule) bg-(--stock-rack) px-3 py-2.5">
          <div className="mb-1.5 flex h-4 items-center justify-between gap-3">
            <span className="note truncate">
              {canSendMessages
                ? typingIndicator || "Entries are recorded to the room and persisted."
                : "Join a room to write to this register."}
            </span>
            <span className="legend hidden sm:inline">Enter to record</span>
          </div>
          <div className="flex items-end gap-2">
            <Input
              ref={messageInputRef}
              className="h-10 flex-1"
              value={messageInput}
              disabled={!canSendMessages}
              onChange={(event) => onMessageInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder={
                canSendMessages ? "Share context or decisions…" : "No room — entry field locked"
              }
            />
            <Button
              type="button"
              onClick={onSendMessage}
              disabled={!canSendMessages || !messageInput.trim()}
              className="h-10"
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
