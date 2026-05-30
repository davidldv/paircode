import type { ReactNode } from "react";
import { Hash, Keyboard, LoaderCircle, LogOut, Moon, Sun, Users, Wifi, WifiOff, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatRoomId } from "@/lib/utils";

type HeaderCardProps = {
  status: "idle" | "connecting" | "connected" | "disconnected";
  statusBadgeVariant: "default" | "success" | "danger";
  theme: "light" | "dark";
  mySocketId: string;
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
  onRoomIdChange: (value: string) => void;
  onJoin: () => void;
  onLeave: () => void;
  onToggleTheme: () => void;
  onDismissHints: () => void;
};

export function HeaderCard({
  status,
  statusBadgeVariant,
  theme,
  mySocketId,
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
  onRoomIdChange,
  onJoin,
  onLeave,
  onToggleTheme,
  onDismissHints,
}: HeaderCardProps) {
  return (
    <header className="app-bar fade-up sticky top-3 z-30 px-4 py-3.5 md:px-5">
      {/* Top tier — identity and account controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--surface-strong) ring-1 ring-(--panel-border)">
            <img src="/brand/paircode-mark.svg" alt="PairCode" width={22} height={22} className="opacity-90" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">PairCode</p>
            <p className="truncate text-xs text-(--muted)">
              <span className="text-foreground/80">{operatorName}</span>
              <span className="mx-1.5 text-(--panel-border-strong)">·</span>
              <span className="truncate">{operatorEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant} className="h-7 gap-1.5 px-2.5">
            {status === "connected" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="capitalize">{status}</span>
            {mySocketId ? <span className="mono-label ml-0.5 opacity-60">{mySocketId.slice(0, 4)}</span> : null}
          </Badge>

          <div className="h-5 w-px bg-(--panel-border)" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {authControl}
        </div>
      </div>

      {/* Bottom tier — room switcher and live stats */}
      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-(--panel-border) pt-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-initial">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
            <Input
              value={roomId}
              onChange={(event) => onRoomIdChange(formatRoomId(event.target.value))}
              placeholder="room-code"
              className="h-10 pl-9 font-mono"
            />
          </div>
          <Button onClick={onJoin} className="h-10 shrink-0">
            {status === "connecting" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {status === "connecting" ? "Connecting" : activeRoom ? "Switch" : "Join"}
            </span>
          </Button>
          <Button
            onClick={onLeave}
            variant="secondary"
            disabled={!canLeave}
            className="h-10 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {activeRoom ? (
            <div className="flex items-center gap-2.5 rounded-full border border-(--panel-border) bg-(--surface-strong) py-1 pl-2.5 pr-3.5">
              <span className="live-dot" />
              <span className="text-sm font-medium text-foreground">{activeRoom}</span>
              <span className="hidden text-xs text-(--muted) sm:inline">
                {usersCount} online · {messagesCount} events · AI {modeLabel}
              </span>
            </div>
          ) : (
            <span className="rounded-full border border-(--panel-border) bg-(--surface-strong) px-3.5 py-1.5 text-xs font-medium text-(--muted)">
              Not in a room
            </span>
          )}
        </div>
      </div>

      {showHints ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-(--panel-border) pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-(--muted)">
            <Keyboard className="h-3.5 w-3.5" /> Shortcuts
          </span>
          <Kbd>Shift + M</Kbd>
          <span className="text-xs text-(--muted)">focus message</span>
          <Kbd>Shift + J</Kbd>
          <span className="text-xs text-(--muted)">join room</span>
          <Kbd>⌘ / Ctrl + ↵</Kbd>
          <span className="text-xs text-(--muted)">send / run</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismissHints}
            className="ml-auto h-7 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5" /> Dismiss
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-(--panel-border) bg-(--surface-strong) px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </kbd>
  );
}
