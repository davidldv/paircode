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
  currentAuthUserId: string;
  roomOwner: RoomOwner | null;
  canManageRoom: boolean;
  onRemoveMember: (memberAuthUserId: string, memberName: string) => void;
};

export function PresenceSidebar({
  users,
  roomMembers,
  mySocketId,
  currentAuthUserId,
  roomOwner,
  canManageRoom,
  onRemoveMember,
}: PresenceSidebarProps) {
  const connectedMemberIds = new Set(users.map((user) => user.authUserId).filter(Boolean));

  return (
    <aside className="space-y-4">
      <Card className="section-panel stage-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-(--accent)" /> Team Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {roomOwner?.authUserId === user.authUserId ? (
                    <Badge className="border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] text-foreground">owner</Badge>
                  ) : null}
                  {user.id === mySocketId ? <Badge>you</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
          {users.length === 0 ? <p className="mt-3 text-sm text-(--muted)">Join a room to see active collaborators.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-(--accent)" /> Room Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {roomMembers.map((member) => {
              const isOwner = roomOwner?.authUserId === member.authUserId;
              const isSelf = currentAuthUserId === member.authUserId;
              const isConnected = connectedMemberIds.has(member.authUserId);

              return (
                <li key={member.authUserId} className="rounded-2xl border border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-soft)_76%,transparent)] px-3 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{member.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {isConnected ? <Badge>online</Badge> : <Badge className="border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] text-(--muted)">offline</Badge>}
                          {isOwner ? <Badge className="border-(--panel-border) bg-[color-mix(in_srgb,var(--panel-strong)_92%,transparent)] text-foreground">owner</Badge> : null}
                          {isSelf ? <Badge>you</Badge> : null}
                        </div>
                      </div>
                    </div>

                    {canManageRoom && !isOwner ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => onRemoveMember(member.authUserId, member.name)}
                      >
                        <ShieldMinus className="h-4 w-4" /> Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {roomMembers.length === 0 ? <p className="mt-3 text-sm text-(--muted)">Join a room to load its persisted member list.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-3">
        <CardHeader>
          <CardTitle className="text-lg">Workflow Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-(--muted)">
          <p className="leading-6">Open a second tab to simulate another teammate in the same room.</p>
          <p className="leading-6">Pin important file paths and requirements before invoking the room agent.</p>
          <p className="leading-6">Press Enter to send quickly during active discussion.</p>
          <div className="panel-rule my-4" />
          <p className="flex items-center gap-2 text-xs">
            <Keyboard className="h-3.5 w-3.5" /> Shift+M jumps to message input.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}