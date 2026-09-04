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
      <main className="flex min-h-screen items-center justify-center px-4">
        {/* The reader, mid-read. */}
        <div className="w-full max-w-sm">
          <div className="credential reader-sweep relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-(--secure-deep) bg-(--secure) px-3 py-1.5 text-(--secure-ink)">
              <img src="/brand/paircode-mark.svg" alt="" width={18} height={18} />
              <span className="legend text-(--secure-ink)">PairCode</span>
              <span className="lamp lamp-reading ml-auto" />
            </div>
            <div className="px-4 py-6 text-center">
              <h1 className="text-base font-[600] text-(--ink)">Reading your credential</h1>
              <p className="mx-auto mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-(--ink-2)">
                Verifying your session and opening a secure connection to the room server.
              </p>
            </div>
            <div className="mrz" aria-hidden>
              <div>{"<".repeat(30)}</div>
              <div>{"<".repeat(30)}</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:flex lg:h-[100dvh] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
      <HeaderCard
          status={status}
          statusBadgeVariant={statusBadgeVariant}
          theme={theme}
          mySocketId={mySocketId}
          operatorId={user.id}
          roomId={roomId}
          operatorName={name}
          operatorEmail={operatorEmail}
          authControl={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="border-transparent text-(--secure-ink) hover:bg-(--secure-ink)/12 hover:text-(--secure-ink)"
            >
              Sign out
            </Button>
          }
          activeRoom={activeRoom}
          usersCount={users.length}
          messagesCount={sortedMessages.length}
          modeLabel={modeLabel}
          showHints={showHints}
          onOpenActions={openMobilePalette}
          canLeave={Boolean(activeRoom) || status === "connected" || status === "connecting"}
          onRoomIdChange={setRoomId}
          onJoin={handleJoin}
          onLeave={handleLeave}
          onToggleTheme={handleToggleTheme}
          onDismissHints={dismissHints}
        />

      <section className="mx-auto grid w-full max-w-[1560px] gap-3 px-3 py-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[19rem_minmax(0,1fr)_22rem] lg:overflow-hidden lg:px-5 lg:py-4">
          <div className="order-2 lg:order-none lg:contents">
          <PresenceSidebar
            users={users}
            roomMembers={roomMembers}
            mySocketId={mySocketId}
            currentUserId={user.id}
            currentUserEmail={user.email}
            roomOwner={roomOwner}
            canManageRoom={canManageRoom}
            onRemoveMember={removeMember}
          />
          </div>

          <div className="order-1 lg:order-none lg:contents">
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
          </div>

          <div className="order-3 lg:order-none lg:contents">
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
          </div>
      </section>

      <MobileCommandPalette
        open={mobilePaletteOpen}
        theme={theme}
        canLeave={Boolean(activeRoom) || status === "connected" || status === "connecting"}
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
