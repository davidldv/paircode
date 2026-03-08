import { Keyboard, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialsFromName, type RoomUser } from "@/lib/paircode";

type PresenceSidebarProps = {
  users: RoomUser[];
  mySocketId: string;
};

export function PresenceSidebar({ users, mySocketId }: PresenceSidebarProps) {
  return (
    <aside className="space-y-4">
      <Card className="section-panel stage-1">
        <CardHeader>
          <div className="section-kicker">Workspace Roster</div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-(--accent)" /> Team Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between rounded-[1rem] border border-(--panel-border) bg-[color:color-mix(in_srgb,var(--panel-soft)_76%,transparent)] px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                {user.id === mySocketId ? <Badge>you</Badge> : null}
              </li>
            ))}
          </ul>
          {users.length === 0 ? <p className="mt-3 text-sm text-(--muted)">Join a room to see active collaborators.</p> : null}
        </CardContent>
      </Card>

      <Card className="section-panel stage-2">
        <CardHeader>
          <div className="section-kicker">Operational Guidance</div>
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