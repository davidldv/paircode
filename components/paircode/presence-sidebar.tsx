"use client";

import { useState } from "react";
import { ShieldMinus } from "lucide-react";

import { IdentityPanel } from "@/components/paircode/identity";
import { Button } from "@/components/ui/button";
import {
  isGuestOperator,
  type RoomMember,
  type RoomOwner,
  type RoomUser,
} from "@/lib/paircode";
import { cn } from "@/lib/utils";

type PresenceSidebarProps = {
  users: RoomUser[];
  roomMembers: RoomMember[];
  mySocketId: string;
  currentUserId: string;
  currentUserEmail: string;
  roomOwner: RoomOwner | null;
  canManageRoom: boolean;
  onRemoveMember: (memberUserId: string, memberName: string) => void;
};

/**
 * The rack. One rack, two courses: a credential at the reader holds a live
 * socket, a credential in the rack is enrolled in the room's persisted member
 * list. Presence and membership are different facts and the rack keeps them
 * apart physically rather than duplicating one list into two panels.
 */
export function PresenceSidebar({
  users,
  roomMembers,
  mySocketId,
  currentUserId,
  currentUserEmail,
  roomOwner,
  canManageRoom,
  onRemoveMember,
}: PresenceSidebarProps) {
  const connectedMemberIds = new Set(users.map((user) => user.userId).filter(Boolean));
  // A revocation that has been issued but whose removal the server has not yet
  // broadcast. The credential is struck in place for that window.
  const [revoking, setRevoking] = useState<string[]>([]);

  return (
    <aside className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      <section className="sheet">
        <div className="sheet-head">
          <span className="legend legend-lg text-(--secure-ink)">The rack</span>
        </div>

        <Course
          title="At the reader"
          count={users.length}
          empty="No credential is at the reader."
        >
          {users.map((user, index) => (
            <Credential
              key={user.id}
              seed={user.userId || user.id}
              name={user.name}
              serialLabel="Socket"
              serial={user.id}
              role={roomOwner?.userId === user.userId ? "owner" : "member"}
              present
              provisional={user.userId === currentUserId && isGuestOperator(currentUserEmail)}
              isSelf={user.id === mySocketId}
              index={index}
            />
          ))}
        </Course>

        <Course
          title="Enrolled in the room"
          count={roomMembers.length}
          empty="Join a room to load its persisted member list."
        >
          {roomMembers.map((member, index) => {
            const isOwner = member.role === "owner" || roomOwner?.userId === member.userId;
            const isSelf = currentUserId === member.userId;
            return (
              <Credential
                key={member.userId}
                seed={member.userId}
                name={member.name}
                serialLabel="Ser"
                serial={member.userId}
                role={isOwner ? "owner" : "member"}
                present={connectedMemberIds.has(member.userId)}
                provisional={isSelf && isGuestOperator(currentUserEmail)}
                isSelf={isSelf}
                index={index}
                revoked={revoking.includes(member.userId)}
                onRevoke={
                  canManageRoom && !isOwner
                    ? () => {
                        setRevoking((ids) => [...ids, member.userId]);
                        onRemoveMember(member.userId, member.name);
                      }
                    : undefined
                }
              />
            );
          })}
        </Course>

        {/* One legend held level: everything above is decodable from here. */}
        <div className="border-t border-(--rule) bg-(--stock-rack) px-3 py-1">
          <span className="legend">Key to the marks</span>
        </div>
        <dl className="space-y-2 px-3 py-2.5">
          <KeyRow
            mark={
              <span className="legend rounded-[2px] bg-(--secure) px-1.5 py-px text-(--secure-ink)">
                Owner
              </span>
            }
          >
            Solid band. Edits standing context, issues passes, revokes members.
          </KeyRow>
          <KeyRow
            mark={
              <span className="legend rounded-[2px] bg-(--stock-rack) px-1.5 py-px text-(--ink-2) ring-1 ring-(--rule)">
                Member
              </span>
            }
          >
            Plain band. Reads everything, writes to the register.
          </KeyRow>
          <KeyRow mark={<VisitorChip />}>
            Ochre mark on the band. A guest session — real, and short-lived. It is
            not a role: a visitor can own a room.
          </KeyRow>
          <KeyRow mark={<AwayChip />}>
            Enrolled, but holding no live socket right now.
          </KeyRow>
          <KeyRow mark={<span className="lamp lamp-live" />}>
            Reader lamp. Green admitted, amber reading, red refused.
          </KeyRow>
          <KeyRow mark={<span className="stamp">Revoked</span>}>
            Cancellation. Access is struck server-side, not hidden client-side.
          </KeyRow>
        </dl>

        <div className="space-y-1.5 border-t border-(--rule) bg-(--stock-sunk) px-3 py-2.5">
          <span className="legend">Working notes</span>
          <p className="note">Open a second tab to simulate another teammate in the same room.</p>
          <p className="note">
            Pin important file paths and requirements before invoking the room agent.
          </p>
          <p className="note">Press Enter to send quickly during active discussion.</p>
        </div>
      </section>
    </aside>
  );
}

function Course({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-y border-(--rule) bg-(--stock-rack) px-3 py-1">
        <span className="legend">{title}</span>
        <span className="value ml-auto text-[0.6875rem] text-(--ink-2)">
          {String(count).padStart(2, "0")}
        </span>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        {count === 0 ? (
          <p className="border border-dashed border-(--rule-strong) bg-(--stock-sunk) px-3 py-4 text-center text-[0.8125rem] leading-relaxed text-(--ink-3)">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </>
  );
}

function VisitorChip() {
  return (
    <span className="legend rounded-[2px] bg-(--provisional) px-1.5 py-px text-(--provisional-ink)">
      Visitor
    </span>
  );
}

function AwayChip() {
  return (
    <span className="legend rounded-[2px] border border-dashed border-(--ink-3) px-1.5 py-px text-(--ink-3)">
      Away
    </span>
  );
}

function Credential({
  seed,
  name,
  serialLabel,
  serial,
  role,
  present,
  provisional,
  isSelf,
  index,
  revoked,
  onRevoke,
}: {
  seed: string;
  name: string;
  serialLabel: string;
  serial: string;
  role: "owner" | "member";
  present: boolean;
  provisional: boolean;
  isSelf: boolean;
  index: number;
  revoked?: boolean;
  onRevoke?: () => void;
}) {
  return (
    <article
      className={cn("credential rail-in overflow-hidden", !present && "opacity-75")}
      style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
    >
      {revoked ? <span className="stamp stamp-struck">Revoked</span> : null}

      <div className="flex items-start gap-2.5 p-2.5">
        <IdentityPanel seed={seed} name={name} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-[600] leading-tight text-(--ink)">
              {name}
            </p>
            {present ? <span className="lamp lamp-live mt-1.5" title="At the reader" /> : null}
          </div>

          <dl className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <dt className="legend">{serialLabel}</dt>
            <dd className="value min-w-0 flex-1 truncate text-[0.6875rem] text-(--ink-2)">
              {serial.slice(0, 12) || "—"}
            </dd>
            {!present ? <AwayChip /> : null}
          </dl>
        </div>

        {onRevoke ? (
          <Button
            type="button"
            variant="cancel"
            size="icon"
            className="shrink-0"
            aria-label={`Revoke ${name}`}
            title={`Revoke ${name}`}
            onClick={onRevoke}
          >
            <ShieldMinus className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <div className={cn("band", role === "member" && "band-plain")}>
        <span className="legend text-inherit">{role}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {provisional ? <VisitorChip /> : null}
          {isSelf ? <span className="legend text-inherit">Bearer</span> : null}
        </span>
      </div>
    </article>
  );
}

function KeyRow({ mark, children }: { mark: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <dt className="flex w-[4.5rem] shrink-0 justify-start pt-px">{mark}</dt>
      <dd className="note flex-1">{children}</dd>
    </div>
  );
}
