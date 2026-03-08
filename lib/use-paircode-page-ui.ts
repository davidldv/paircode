"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { type AgentMode } from "@/lib/paircode";

type UsePaircodePageUiOptions = {
  messageInputRef: RefObject<HTMLInputElement | null>;
  onJoin: () => void;
  onSendMessage: () => void;
  onAskAgent: (mode: AgentMode) => void;
  agentMode: AgentMode;
};

export function usePaircodePageUi({
  messageInputRef,
  onJoin,
  onSendMessage,
  onAskAgent,
  agentMode,
}: UsePaircodePageUiOptions) {
  const joinShortcutRef = useRef(onJoin);
  const sendShortcutRef = useRef(onSendMessage);
  const agentShortcutRef = useRef<() => void>(() => onAskAgent(agentMode));
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  const focusMessageInput = useCallback(() => {
    messageInputRef.current?.focus();
  }, [messageInputRef]);

  const openMobilePalette = useCallback(() => {
    setMobilePaletteOpen(true);
  }, []);

  const closeMobilePalette = useCallback(() => {
    setMobilePaletteOpen(false);
  }, []);

  useEffect(() => {
    joinShortcutRef.current = onJoin;
    sendShortcutRef.current = onSendMessage;
    agentShortcutRef.current = () => onAskAgent(agentMode);
  }, [agentMode, onAskAgent, onJoin, onSendMessage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m" && event.shiftKey) {
        event.preventDefault();
        focusMessageInput();
        return;
      }

      if (event.key.toLowerCase() === "j" && event.shiftKey) {
        event.preventDefault();
        joinShortcutRef.current();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "textarea") {
          event.preventDefault();
          agentShortcutRef.current();
          return;
        }

        if (activeTag === "input") {
          event.preventDefault();
          sendShortcutRef.current();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMessageInput]);

  useEffect(() => {
    if (!mobilePaletteOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobilePaletteOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobilePaletteOpen]);

  return {
    mobilePaletteOpen,
    focusMessageInput,
    openMobilePalette,
    closeMobilePalette,
  };
}