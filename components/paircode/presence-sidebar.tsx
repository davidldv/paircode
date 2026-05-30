import { Lightbulb, ShieldMinus, UserRound, Users } from "lucide-react";

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

function PanelHeading({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <CardHeader className="flex-row items-center justify-between border-b border-(--panel-border) py-4">
      <CardTitle className="flex items-center gap-2.5 text-[15px]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-tint) text-(--accent)">
          {icon}
        </span>
        {title}
      </CardTitle>
      {typeof count === "number" ? <Badge>{count}</Badge> : null}
    </CardHeader>
  );
}

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
    <aside className="space-y-5">
      <Card className="section-panel stage-1">
        <PanelHeading icon={<Users className="h-4 w-4" />} title="Team Presence" count={users.length} />
        <CardContent className="p-3">
          <ul className="space-y-1.5">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors hover:bg-(--surface-strong)"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[11px]">{initialsFromName(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-(--success) ring-2 ring-(--surface)" />
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {roomOwner?.userId === user.userId ? (
                    <Badge className="border-transparent bg-(--accent-tint) text-(--accent)">Owner</Badge>
                  ) : null}
                  {user.id === mySocketId ? <Badge>You</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
          {users.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-(--muted)">Join a room to see active collaborators.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-2">
        <PanelHeading icon={<UserRound className="h-4 w-4" />} title="Room Members" count={roomMembers.length} />
        <CardContent className="p-3">
          <ul className="space-y-1.5">
            {roomMembers.map((member) => {
              const isOwner = member.role === "owner" || roomOwner?.userId === member.userId;
              const isSelf = currentUserId === member.userId;
              const isConnected = connectedMemberIds.has(member.userId);

              return (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-(--surface-strong)"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[11px]">{initialsFromName(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {isConnected ? (
                          <Badge variant="success">Online</Badge>
                        ) : (
                          <Badge>Offline</Badge>
                        )}
                        {isOwner ? (
                          <Badge className="border-transparent bg-(--accent-tint) text-(--accent)">Owner</Badge>
                        ) : null}
                        {isSelf ? <Badge>You</Badge> : null}
                      </div>
                    </div>
                  </div>

                  {canManageRoom && !isOwner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-(--muted) hover:text-(--danger)"
                      aria-label={`Remove ${member.name}`}
                      title={`Remove ${member.name}`}
                      onClick={() => onRemoveMember(member.userId, member.name)}
                    >
                      <ShieldMinus className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {roomMembers.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-(--muted)">Join a room to load its persisted member list.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-3">
        <PanelHeading icon={<Lightbulb className="h-4 w-4" />} title="Workflow Tips" />
        <CardContent className="space-y-3 p-5 text-sm leading-relaxed text-(--muted)">
          <p>Open a second tab to simulate another teammate in the same room.</p>
          <p>Pin important file paths and requirements before invoking the room agent.</p>
          <p>Press Enter to send quickly during active discussion.</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-(--accent-tint) px-3 py-2 text-xs font-medium text-(--accent)">
            <Lightbulb className="h-3.5 w-3.5" /> Shift + M jumps to the message input.
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
