import type { ReactNode } from "react";
import { CircleSlash2, LoaderCircle, LogOut, Moon, Sun, Users, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandConstellation } from "@/components/paircode/brand-constellation";

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
    <Card className="hero-shell fade-up">
      <CardHeader className="gap-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-3">
            <div className="section-kicker">Collaborative Engineering Room</div>
            <div className="space-y-2">
              <CardTitle className="text-4xl leading-none sm:text-5xl">PairCode</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-6">
                A room for collaborative engineering with persistent threaded context, live presence, AI facilitation, and room-level implementation history.
              </CardDescription>
            </div>

            <div className="grid gap-3 pt-1 text-sm md:grid-cols-3">
              <div className="metric-tile">
                <p className="mono-label text-[10px] text-(--muted)">Collaboration State</p>
                <p className="mt-2 font-semibold text-foreground">{activeRoom ? "Workspace is active" : "Waiting to enter"}</p>
                <p className="mt-1 text-xs text-(--muted)">{activeRoom ? `Active room: ${activeRoom}` : "Create or join a room to establish the shared implementation surface."}</p>
              </div>
              <div className="metric-tile">
                <p className="mono-label text-[10px] text-(--muted)">Live Participation</p>
                <p className="mt-2 font-semibold text-foreground">{usersCount} collaborator{usersCount === 1 ? "" : "s"}</p>
                <p className="mt-1 text-xs text-(--muted)">{messagesCount} event{messagesCount === 1 ? "" : "s"} tracked across the room timeline.</p>
              </div>
              <div className="metric-tile">
                <p className="mono-label text-[10px] text-(--muted)">AI Facilitation</p>
                <p className="mt-2 font-semibold text-foreground">{modeLabel}</p>
                <p className="mt-1 text-xs text-(--muted)">Ground the shared context before asking the agent to summarize, plan, or implement.</p>
              </div>
            </div>

            <BrandConstellation compact className="pt-1" />
          </div>

          <div className="min-w-65 space-y-3 rounded-[1.35rem] border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-end gap-2">
              <div className="rounded-full border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_88%,transparent)] p-1">
                {authControl}
              </div>
              <Badge variant={statusBadgeVariant}>
                {status === "connected" ? <Wifi className="mr-1.5 h-3 w-3" /> : <WifiOff className="mr-1.5 h-3 w-3" />}
                {status}
              </Badge>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={onToggleTheme}
                aria-label="Toggle color theme"
                title="Toggle theme"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>

            <div className="rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] p-3">
              <p className="mono-label text-[10px] text-(--muted)">Socket Identity</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                {mySocketId ? mySocketId.slice(0, 8) : "not connected"}
              </p>
              <p className="mt-1 text-xs text-(--muted)">Realtime session identity for active operators in the shared room.</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-[1.4rem] border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_74%,transparent)] p-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_180px_220px]">
            <Input value={roomId} onChange={(event) => onRoomIdChange(event.target.value)} placeholder="Room ID" />
            <div className="rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_94%,transparent)] px-3 py-2.5">
              <p className="mono-label text-[10px] text-(--muted)">Authenticated operator</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{operatorName}</p>
              <p className="truncate text-xs text-(--muted)">{operatorEmail}</p>
            </div>
            <Button onClick={onJoin} type="button" className="w-full">
              {status === "connecting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {status === "connecting" ? "Connecting..." : "Join Room"}
            </Button>
            <Button onClick={onLeave} type="button" variant="secondary" disabled={!canLeave} className="w-full">
              <LogOut className="h-4 w-4" />
              Leave Room
            </Button>
            <div className="mono-label flex items-center rounded-xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_95%,transparent)] px-3 py-2 text-xs text-(--muted)">
              {activeRoom ? `active room: ${activeRoom}` : "active room: none"}
            </div>
          </div>
        </div>

        <div className="panel-rule my-5" />

        {showHints ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_74%,transparent)] p-3">
            <span className="mono-label text-[10px] text-(--muted)">Shortcuts</span>
            <Badge>Shift+M focus message</Badge>
            <Badge>Shift+J join room</Badge>
            <Badge>Ctrl/Cmd+Enter send/run</Badge>
            <Button type="button" variant="ghost" size="sm" onClick={onDismissHints} className="ml-auto">
              <CircleSlash2 className="h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}