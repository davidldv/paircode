import type { ReactNode } from "react";
import {
  Hash,
  Keyboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Moon,
  SquareMenu,
  Sun,
  X,
} from "lucide-react";

import { IdentityChip } from "@/components/paircode/identity";
import { isGuestOperator } from "@/lib/paircode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatRoomId } from "@/lib/utils";

type HeaderCardProps = {
  status: "idle" | "connecting" | "connected" | "disconnected";
  statusBadgeVariant: "default" | "success" | "danger";
  theme: "light" | "dark";
  mySocketId: string;
  /** The stable identity every guilloché on this surface is engraved from. */
  operatorId: string;
  roomId: string;
  operatorName: string;
  operatorEmail: string;
  authControl: ReactNode;
  activeRoom: string;
  usersCount: number;
  messagesCount: number;
  modeLabel: string;
  showHints: boolean;
  canLeave: boolean;
  /** Opens the quick-actions sheet. Small screens only. */
  onOpenActions: () => void;
  onRoomIdChange: (value: string) => void;
  onJoin: () => void;
  onLeave: () => void;
  onToggleTheme: () => void;
  onDismissHints: () => void;
};

const LAMP: Record<HeaderCardProps["status"], string> = {
  connected: "lamp lamp-live",
  connecting: "lamp lamp-reading",
  disconnected: "lamp lamp-denied",
  idle: "lamp",
};

export function HeaderCard({
  status,
  theme,
  mySocketId,
  operatorId,
  roomId,
  operatorName,
  operatorEmail,
  authControl,
  activeRoom,
  usersCount,
  messagesCount,
  modeLabel,
  showHints,
  canLeave,
  onOpenActions,
  onRoomIdChange,
  onJoin,
  onLeave,
  onToggleTheme,
  onDismissHints,
}: HeaderCardProps) {
  return (
    <header className="sticky top-0 z-30">
      {/* Masthead — the issuing authority, printed across the full sheet. */}
      <div className="flex items-center gap-3 border-b border-(--secure-deep) bg-(--secure) px-3 py-2 text-(--secure-ink) md:px-5">
        <img src="/brand/paircode-mark.svg" alt="" width={26} height={26} className="shrink-0" />
        <span className="text-[0.9375rem] font-[700] uppercase tracking-[0.2em] [font-stretch:78%]">
          PairCode
        </span>

        <span className="ml-1 hidden h-5 w-px bg-(--secure-ink)/25 sm:block" />

        <span className="legend hidden text-(--secure-ink)/85 sm:inline">
          Collaborative engineering rooms
        </span>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex items-center gap-1.5" title={`Connection ${status}`}>
            <span className={LAMP[status]} />
            <span className="legend text-(--secure-ink)">{status}</span>
            {mySocketId ? (
              <span className="value hidden text-[0.6875rem] text-(--secure-ink)/85 sm:inline">
                {mySocketId.slice(0, 6)}
              </span>
            ) : null}
          </span>

          <span className="h-5 w-px bg-(--secure-ink)/25" />

          <button
            type="button"
            onClick={onOpenActions}
            aria-label="Open quick actions"
            className="flex h-8 items-center gap-1.5 rounded-[2px] border border-transparent px-2 text-(--secure-ink) transition-colors duration-100 hover:bg-(--secure-ink)/12 active:translate-y-px lg:hidden"
          >
            <SquareMenu className="h-4 w-4" />
            <span className="legend text-(--secure-ink)">Actions</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-transparent text-(--secure-ink) transition-colors duration-100 hover:bg-(--secure-ink)/12 active:translate-y-px"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {authControl}
        </div>
      </div>

      {/* Bearer strip — whose credential is in the reader, and which door. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-(--rule) bg-(--stock-face) px-3 py-2.5 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <IdentityChip seed={operatorId} name={operatorName} />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[0.8125rem] font-[600] text-(--ink)">{operatorName}</p>
              {isGuestOperator(operatorEmail) ? (
                <span className="legend shrink-0 rounded-[2px] bg-(--provisional) px-1.5 py-px text-(--provisional-ink)">
                  Visitor
                </span>
              ) : null}
            </div>
            <p className="value truncate text-[0.6875rem] text-(--ink-3)">{operatorEmail}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-end gap-2">
          <label className="min-w-0 flex-1 sm:w-56 sm:flex-initial">
            <span className="legend mb-1 block">Room designation</span>
            <span className="relative block">
              <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--ink-3)" />
              <Input
                value={roomId}
                onChange={(event) => onRoomIdChange(formatRoomId(event.target.value))}
                placeholder="room-code"
                className="value pl-9 uppercase tracking-[0.08em]"
              />
            </span>
          </label>
          <Button onClick={onJoin} disabled={status === "connecting"}>
            {status === "connecting" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            {status === "connecting" ? "Reading" : activeRoom ? "Switch" : "Join"}
          </Button>
          <Button onClick={onLeave} variant="secondary" disabled={!canLeave}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>

        {/* Register — the facts the door currently holds. */}
        <dl className="ml-auto flex items-stretch divide-x divide-(--rule) border border-(--rule) bg-(--stock-sunk)">
          <RegisterCell label="Room">
            {activeRoom ? (
              <span className="value text-[1.0625rem] uppercase tracking-[0.04em] text-(--ink)">
                {activeRoom}
              </span>
            ) : (
              <span className="note">none</span>
            )}
          </RegisterCell>
          <RegisterCell label="Present">{usersCount}</RegisterCell>
          <RegisterCell label="Entries">{messagesCount}</RegisterCell>
          <RegisterCell label="Agent">
            <span className="value uppercase text-(--ink)">{modeLabel}</span>
          </RegisterCell>
        </dl>
      </div>

      {showHints ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-(--rule) bg-(--stock-rack) px-3 py-1.5 md:px-5">
          <span className="legend flex items-center gap-1.5">
            <Keyboard className="h-3 w-3" /> Keys
          </span>
          <Kbd>Shift + M</Kbd>
          <span className="note">focus entry</span>
          <Kbd>Shift + J</Kbd>
          <span className="note">join room</span>
          <Kbd>⌘ / Ctrl + ↵</Kbd>
          <span className="note">send or run</span>
          <button
            type="button"
            onClick={onDismissHints}
            className="legend ml-auto flex items-center gap-1 text-(--ink-3) transition-colors hover:text-(--ink)"
          >
            <X className="h-3 w-3" /> Dismiss
          </button>
        </div>
      ) : null}
    </header>
  );
}

function RegisterCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-2.5 py-1">
      <dt className="legend">{label}</dt>
      <dd className="value text-[0.8125rem] leading-tight text-(--ink)">{children}</dd>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="value rounded-[2px] border border-(--rule-strong) bg-(--stock-face) px-1.5 py-px text-[0.6875rem] text-(--ink)">
      {children}
    </kbd>
  );
}
