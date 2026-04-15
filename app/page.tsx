"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ContextSidebar } from "@/components/paircode/context-sidebar";
import { HeaderCard } from "@/components/paircode/header-card";
import { MessagePanel } from "@/components/paircode/message-panel";
import { MobileCommandPalette } from "@/components/paircode/mobile-command-palette";
import { PresenceSidebar } from "@/components/paircode/presence-sidebar";
import { ToastStack } from "@/components/paircode/toast-stack";
import { Button } from "@/components/ui/button";
import { usePaircodePageUi } from "@/lib/use-paircode-page-ui";
import { usePaircodePreferences } from "@/lib/use-paircode-preferences";
import { usePaircodeRoom } from "@/lib/use-paircode-room";
import { usePaircodeSession } from "@/lib/use-paircode-session";
import { formatRoomId } from "@/lib/utils";

export default function Home() {
  const { status: sessionStatus, user, signOut } = usePaircodeSession();
  const isLoaded = sessionStatus !== "loading";
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const consumedInviteRef = useRef<string>("");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const agentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const { theme, showHints, toggleTheme, dismissHints } = usePaircodePreferences();
  const operatorName = user?.displayName ?? "Operator";
  const operatorEmail = user?.email ?? "Authenticated workspace operator";
  const {
    status,
    mySocketId,
    roomId,
    setRoomId,
    name,
    setInviteToken,
    activeRoom,
    activeInvite,
    activeInviteLink,
    roomMembers,
    roomOwner,
    canManageRoom,
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
    createInvite,
    copyInviteLink,
    removeMember,
    insertStarterMessage,
    pushToast,
  } = usePaircodeRoom({
    userId: user?.id ?? "",
    userName: operatorName,
  });
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

  useEffect(() => {
    if (!isLoaded || !user) return;

    const url = new URL(window.location.href);
    const invitedRoomId = formatRoomId(url.searchParams.get("room")?.trim() ?? "");
    const signedInviteToken = url.searchParams.get("invite")?.trim() ?? "";
    const inviteKey = `${invitedRoomId}:${signedInviteToken}`;

    if (!invitedRoomId || !signedInviteToken || consumedInviteRef.current === inviteKey) {
      return;
    }

    consumedInviteRef.current = inviteKey;
    setRoomId(invitedRoomId);
    setInviteToken(signedInviteToken);
    pushToast({
      title: "Invite link detected",
      detail: `Preparing access for ${invitedRoomId}.`,
      variant: "success",
    });

    void handleJoin({ roomId: invitedRoomId, inviteToken: signedInviteToken });

    url.searchParams.delete("room");
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [handleJoin, isLoaded, pushToast, setInviteToken, setRoomId, user]);

  if (!isLoaded || !user) {
    return (
      <main className="app-shell relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4">
          <div className="hero-shell w-full max-w-xl border border-(--panel-border) shadow-xl p-12 text-center bg-(--surface) rounded-2xl animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 bg-(--surface-strong) rounded-full mb-6 animate-pulse-slow">
              <img src="/brand/paircode-mark.svg" alt="" width={48} height={48} className="opacity-80" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connecting to workspace...</h1>
            <p className="mt-3 text-sm leading-relaxed text-(--muted) max-w-sm mx-auto">
              Please wait while we verify your session and establish a secure connection.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell relative min-h-screen bg-background pb-10 text-foreground selection:bg-(--accent) selection:text-background">

      <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-4 pt-5 lg:px-8 lg:pt-8">
        <HeaderCard
          status={status}
          statusBadgeVariant={statusBadgeVariant}
          theme={theme}
          mySocketId={mySocketId}
          roomId={roomId}
          operatorName={name}
          operatorEmail={operatorEmail}
          authControl={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="text-xs font-medium text-(--muted) hover:text-foreground hover:bg-(--surface-strong) transition-colors rounded-lg px-3"
            >
              Sign out
            </Button>
          }
          activeRoom={activeRoom}
          usersCount={users.length}
          messagesCount={sortedMessages.length}
          modeLabel={modeLabel}
          showHints={showHints}
          canLeave={Boolean(activeRoom) || status === "connected" || status === "connecting"}
          onRoomIdChange={setRoomId}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onToggleTheme={handleToggleTheme}
          onDismissHints={dismissHints}
        />

        <section className="fade-up-delay grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)_370px]">
          <PresenceSidebar
            users={users}
            roomMembers={roomMembers}
            mySocketId={mySocketId}
            currentUserId={user.id}
            roomOwner={roomOwner}
            canManageRoom={canManageRoom}
            onRemoveMember={removeMember}
          />

          <MessagePanel
            messages={sortedMessages}
            typingIndicator={typingIndicator}
            activeRoom={activeRoom}
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
            activeRoom={activeRoom}
            activeInvite={activeInvite}
            activeInviteLink={activeInviteLink}
            roomOwner={roomOwner}
            canManageRoom={canManageRoom}
            lastContextUpdateBy={lastContextUpdateBy}
            agentInput={agentInput}
            agentMode={agentMode}
            agentStreaming={agentStreaming}
            lastError={lastError}
            agentInputRef={agentInputRef}
            onContextChange={updateContext}
            onCreateInvite={createInvite}
            onCopyInviteLink={copyInviteLink}
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
