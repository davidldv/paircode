import type { ReactNode } from "react";
import { CircleSlash2, LoaderCircle, LogOut, Moon, Sun, Users, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card className="surface-card fade-up animate-slide-up border border-(--panel-border) bg-(--surface) shadow-md rounded-2xl overflow-hidden p-0 mb-6">
      <CardHeader className="p-5 md:p-6 pb-4 flex flex-col md:flex-row md:items-start justify-between border-b border-(--panel-border) gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-(--surface-strong) w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <img src="/brand/paircode-mark.svg" alt="Logo" width={28} height={28} className="opacity-90" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">PairCode</CardTitle>
            <CardDescription className="text-sm text-(--muted)">
              Welcome back, <span className="font-medium text-foreground">{operatorName}</span>
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariant} className="flex gap-1.5 px-3 py-1 text-xs">
            {status === "connected" ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="capitalize">{status}</span>
            {mySocketId && <span className="font-mono ml-1 opacity-70">({mySocketId.slice(0, 4)})</span>}
          </Badge>
          <div className="flex border border-(--panel-border) rounded-xl p-1 bg-(--surface-strong)">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="h-8 w-8 rounded-lg hover:bg-(--surface)"
            >
              {theme === "light" ? <Moon className="h-4 w-4 text-(--muted)" /> : <Sun className="h-4 w-4 text-(--muted)" />}
            </Button>
            <div className="w-px bg-(--panel-border) mx-1" />
            {authControl}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6 bg-(--surface-strong)/30 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4 max-w-4xl">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Workspace Room</label>
            <Input 
              value={roomId} 
              onChange={(event) => onRoomIdChange(event.target.value)} 
              placeholder="Enter Room Code..." 
              className="h-12 bg-(--surface) border-(--panel-border-strong) rounded-xl focus-visible:ring-2 focus-visible:ring-(--focus-ring) transition-all"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onJoin} 
              className="h-12 px-6 rounded-xl bg-(--accent) hover:bg-(--accent-soft) text-white shadow-(--accent-glow) transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {status === "connecting" ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
              {status === "connecting" ? "Connecting..." : activeRoom ? "Switch Room" : "Join Room"}
            </Button>

            <Button 
              onClick={onLeave} 
              variant="secondary" 
              disabled={!canLeave} 
              className="h-12 px-6 rounded-xl border border-(--panel-border) bg-(--surface) text-foreground hover:bg-(--surface-strong) transition-all"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          {activeRoom ? (
            <div className="inline-flex items-center text-sm font-medium text-(--accent) bg-(--accent)/10 px-3 py-1.5 rounded-lg border border-(--accent)/20">
              <span className="relative flex h-2 w-2 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-(--accent)"></span>
              </span>
              Active Room: {activeRoom}
            </div>
          ) : (
            <div className="inline-flex items-center text-sm font-medium text-(--muted) border border-(--panel-border) bg-(--surface) px-3 py-1.5 rounded-lg">
              Not in a room
            </div>
          )}
          {activeRoom && (
            <div className="ml-4 text-xs text-(--muted)">
              {usersCount} online • {messagesCount} events • AI: {modeLabel}
            </div>
          )}
        </div>

        {showHints ? (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-(--panel-border)">
            <span className="text-xs font-semibold text-(--muted) mr-2 tracking-wide uppercase">Shortcuts</span>
            <kbd className="px-2 py-1 bg-(--surface) border border-(--panel-border) rounded-md text-xs font-medium text-foreground shadow-sm">Shift+M focus message</kbd>
            <kbd className="px-2 py-1 bg-(--surface) border border-(--panel-border) rounded-md text-xs font-medium text-foreground shadow-sm">Shift+J join room</kbd>
            <kbd className="px-2 py-1 bg-(--surface) border border-(--panel-border) rounded-md text-xs font-medium text-foreground shadow-sm">Ctrl/Cmd+Enter send/run</kbd>
            <Button type="button" variant="ghost" size="sm" onClick={onDismissHints} className="ml-auto text-(--muted) hover:text-foreground h-8 rounded-lg">
              <CircleSlash2 className="h-3.5 w-3.5 mr-1.5" /> Dismiss
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}