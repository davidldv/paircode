import { Keyboard, ShieldMinus, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialsFromName, type RoomMember, type RoomOwner, type RoomUser } from "@/lib/paircode";

type PresenceSidebarProps = {
  users: RoomUser[];
  roomMembers: RoomMember[];
  mySocketId: string;
  currentUserId: string;
  roomOwner: RoomOwner | null;
  canManageRoom: boolean;
  onRemoveMember: (memberUserId: string, memberName: string) => void;
};

export function PresenceSidebar({
  users,
  roomMembers,
  mySocketId,
  currentUserId,
  roomOwner,
  canManageRoom,
  onRemoveMember,
}: PresenceSidebarProps) {
  const connectedMemberIds = new Set(users.map((user) => user.userId).filter(Boolean));

  return (
    <aside className="space-y-6">
      <Card className="section-panel stage-1 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--surface-strong)">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-foreground">
            <Users className="h-5 w-5 text-(--accent)" /> Team Presence
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between border border-(--panel-border) bg-(--surface-strong) px-3 py-2.5 text-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border border-(--panel-border) rounded-xl">
                    <AvatarFallback className="rounded-xl bg-background font-bold text-[10px] text-foreground">{initialsFromName(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-extrabold uppercase tracking-wide">{user.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {roomOwner?.userId === user.userId ? (
                    <Badge className="border border-(--panel-border) bg-(--accent) text-(--background) rounded-xl font-bold">OWNER</Badge>
                  ) : null}
                  {user.id === mySocketId ? <Badge className="border border-(--panel-border) bg-(--foreground) text-(--background) rounded-xl font-bold hover:bg-(--foreground)">YOU</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
          {users.length === 0 ? <p className="mt-3 text-xs font-mono font-bold uppercase text-(--muted)">Join a room to see active collaborators.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-2 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--surface-strong)">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-foreground">
            <Users className="h-5 w-5 text-(--accent)" /> Room Members
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {roomMembers.map((member) => {
              const isOwner = member.role === "owner" || roomOwner?.userId === member.userId;
              const isSelf = currentUserId === member.userId;
              const isConnected = connectedMemberIds.has(member.userId);

              return (
                <li key={member.userId} className="border border-(--panel-border) bg-(--surface-strong) px-3 py-2.5 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7 border border-(--panel-border) rounded-xl">
                        <AvatarFallback className="rounded-xl bg-background font-bold text-[10px] text-foreground">{initialsFromName(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold uppercase tracking-wide text-foreground">{member.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {isConnected ? <Badge className="border border-(--panel-border) bg-(--success) text-(--background) rounded-xl font-bold">ONLINE</Badge> : <Badge className="border border-(--panel-border) bg-background text-(--muted) rounded-xl font-bold">OFFLINE</Badge>}
                          {isOwner ? <Badge className="border border-(--panel-border) bg-(--accent) text-(--background) rounded-xl font-bold">OWNER</Badge> : null}
                          {isSelf ? <Badge className="border border-(--panel-border) bg-(--foreground) text-(--background) rounded-xl font-bold hover:bg-(--foreground)">YOU</Badge> : null}
                        </div>
                      </div>
                    </div>

                    {canManageRoom && !isOwner ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 border border-transparent hover:border-(--panel-border) rounded-xl font-bold tracking-wider uppercase text-[10px] hover:shadow-sm transition-all"
                        onClick={() => onRemoveMember(member.userId, member.name)}
                      >
                        <ShieldMinus className="h-4 w-4 mr-1" /> RMV
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {roomMembers.length === 0 ? <p className="mt-3 text-xs font-mono font-bold uppercase text-(--muted)">Join a room to load its persisted member list.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-3 border border-(--panel-border) bg-(--surface) shadow-sm rounded-xl">
        <CardHeader className="border-b-2 border-(--panel-border) bg-(--surface-strong)">
          <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground">Workflow Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm text-foreground font-mono">
          <p className="leading-6">Open a second tab to simulate another teammate in the same room.</p>
          <p className="leading-6">Pin important file paths and requirements before invoking the room agent.</p>
          <p className="leading-6">Press Enter to send quickly during active discussion.</p>
          <div className="panel-rule my-4" />
          <p className="flex items-center gap-2 text-xs font-bold bg-(--accent) text-(--background) px-2 py-1 uppercase tracking-wider border border-(--panel-border)">
            <Keyboard className="h-3.5 w-3.5" /> Shift+M jumps to message input.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}