"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ContextSidebar } from "@/components/paircode/context-sidebar";
import { HeaderCard } from "@/components/paircode/header-card";
import { MessagePanel } from "@/components/paircode/message-panel";
import { MobileCommandPalette } from "@/components/paircode/mobile-command-palette";
import { PresenceSidebar } from "@/components/paircode/presence-sidebar";
import { ToastStack } from "@/components/paircode/toast-stack";
import { usePaircodePageUi } from "@/lib/use-paircode-page-ui";
import { usePaircodePreferences } from "@/lib/use-paircode-preferences";
import { usePaircodeRoom } from "@/lib/use-paircode-room";

export default function Home() {
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const agentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const { theme, showHints, toggleTheme, dismissHints } = usePaircodePreferences();
  const {
    status,
    mySocketId,
    roomId,
    setRoomId,
    name,
    setName,
    activeRoom,
    users,
    sortedMessages,
    messageInput,
    agentInput,
    setAgentInput,
    agentMode,
    setAgentMode,
    context,
    lastContextUpdateBy,
    agentStreaming,
    lastError,
    toasts,
    typingIndicator,
    statusBadgeVariant,
    modeLabel,
    handleJoin,
    handleLeave,
    handleSendMessage,
    handleTyping,
    updateContext,
    askAgent,
    insertStarterMessage,
    pushToast,
  } = usePaircodeRoom();
  const {
    mobilePaletteOpen,
    focusMessageInput,
    openMobilePalette,
    closeMobilePalette,
  } = usePaircodePageUi({
    messageInputRef,
    onJoin: handleJoin,
    onSendMessage: handleSendMessage,
    onAskAgent: askAgent,
    agentMode,
  });

  const handleToggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    toggleTheme();
    pushToast({ title: `Switched to ${next} theme`, variant: "default" });
  }, [theme, toggleTheme, pushToast]);

  const handleMessageViewportScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isNearBottom = distanceFromBottom < 96;
    shouldAutoScrollRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom);
  }, []);

  const handleJumpToLatest = useCallback(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;

    shouldAutoScrollRef.current = true;
    setShowJumpToLatest(false);
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;

    if (!shouldAutoScrollRef.current) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [sortedMessages.length]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <main className="app-shell relative min-h-screen overflow-hidden bg-background pb-10 text-foreground">
      <div className="float-glow pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-[rgba(216,93,45,0.15)] blur-3xl" />
      <div className="float-glow pointer-events-none absolute right-4 top-24 h-52 w-52 rounded-full bg-[rgba(61,137,130,0.14)] blur-3xl" />

      <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-4 pt-5 lg:px-8 lg:pt-8">
        <div className="fade-up flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="section-kicker">
            Pair Programming Control Surface
          </div>
          <div className="mono-label text-[11px] text-(--muted)">
            Enterprise Realtime Workspace
          </div>
        </div>

        <HeaderCard
          status={status}
          statusBadgeVariant={statusBadgeVariant}
          theme={theme}
          mySocketId={mySocketId}
          roomId={roomId}
          name={name}
          activeRoom={activeRoom}
          usersCount={users.length}
          messagesCount={sortedMessages.length}
          modeLabel={modeLabel}
          showHints={showHints}
          canLeave={Boolean(activeRoom) || status === "connected" || status === "connecting"}
          onRoomIdChange={setRoomId}
          onNameChange={setName}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onToggleTheme={handleToggleTheme}
          onDismissHints={dismissHints}
        />

        <section className="fade-up-delay grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)_370px]">
          <PresenceSidebar users={users} mySocketId={mySocketId} />

          <MessagePanel
            messages={sortedMessages}
            typingIndicator={typingIndicator}
            messageInput={messageInput}
            messageInputRef={messageInputRef}
            messageViewportRef={messageViewportRef}
            messageEndRef={messageEndRef}
            onMessageInputChange={handleTyping}
            onMessageViewportScroll={handleMessageViewportScroll}
            showJumpToLatest={showJumpToLatest}
            onJumpToLatest={handleJumpToLatest}
            onSendMessage={handleSendMessage}
            onInsertStarter={insertStarterMessage}
            onFocusInput={focusMessageInput}
          />

          <ContextSidebar
            context={context}
            lastContextUpdateBy={lastContextUpdateBy}
            agentInput={agentInput}
            agentMode={agentMode}
            agentStreaming={agentStreaming}
            lastError={lastError}
            agentInputRef={agentInputRef}
            onContextChange={updateContext}
            onAgentInputChange={setAgentInput}
            onSelectMode={setAgentMode}
            onRunAgent={askAgent}
          />
        </section>
      </div>

      <MobileCommandPalette
        open={mobilePaletteOpen}
        theme={theme}
        canLeave={Boolean(activeRoom) || status === "connected" || status === "connecting"}
        onOpen={openMobilePalette}
        onClose={closeMobilePalette}
        onFocusMessage={focusMessageInput}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onRunAgent={() => askAgent(agentMode)}
        onToggleTheme={handleToggleTheme}
      />

      <ToastStack toasts={toasts} />
    </main>
  );
}
