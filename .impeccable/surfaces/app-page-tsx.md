---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/paircode/header-card.tsx","components/paircode/presence-sidebar.tsx","components/paircode/message-panel.tsx","components/paircode/context-sidebar.tsx"]
---

## Scope and mode

The collaborative room — the whole authenticated app shell: masthead, bearer strip, the rack, the access register, the issuing desk, the mobile action sheet. Visitor mode: **Operate**.

## Audience and job

Two readers, one screen. A hiring manager or senior engineer arrives cold via a guest session and has about a minute to decide whether the person who built this can ship secure backend systems. An operator in a working session needs to read the room's access state at a glance, write to the register, and issue or revoke access without hunting.

Neither reader is served by expression that costs clarity. Where the two conflict, the task wins; the evidence then rides on precision rather than on decoration.

## Task and information

Join or switch a room; see who is connected versus who is enrolled; read and write the register; keep the standing context current; issue, rotate and copy a pass; revoke a member; run the agent in one of three modes. Connection state, room identity, presence count, entry count and agent mode are all readable without scrolling.

## Direction

**The Credential** — access-control badges and security printing, chosen by the user over the roll's assigned direction. Seed key `bfad00c9`.

The room is not a dashboard about an access-control system; it is the credential and the reader. Operators are issued cards with a guilloché portrait panel and a role band. The message stream is an access register of ruled, banded courses. The right column is an issuing desk. The elevated-card grid the category ships is refused outright: sheets are square and hairline-ruled, and the ID-1 12px corner belongs to issued credentials alone.

**The governing rule, and the one that keeps this out of costume: every credential device must encode a real fact.** A role band is a real role. An expiry is the real invite expiry. The MRZ strip is the real signed token, chevron-padded but never case-normalised. The guilloché is a deterministic hypotrochoid derived from the real user id — a visual hash, so no two operators can carry the same figure and one operator carries the same figure everywhere. A cancellation stamp appears only where access is actually revoked. Ornament that means nothing does not ship.

## Memorable moment

The issued pass: a real credential with its machine-readable zone carrying the actual signed invite token. It is the one place where the security mechanism and the visual world are the same object.

## Constraints that shaped it

- Presence and membership are different facts and must never collapse into one list. They are two sections of one rack, separated by whether the credential is at the reader or in it.
- Owner-only capabilities are shown in their real state, never hidden: locked fields carry a diagonal hatch and a corner OWNER ONLY stamp, so the access model stays legible to someone who does not hold the role.
- Status never rides on hue alone. Every lamp, band and stamp carries a word, and the permanent "Key to the marks" panel decodes the whole notation.
- On `lg` and up the room is a fixed `100dvh` shell with three independently scrolling columns so the entry field is always reachable; below that it is a stacked document with a bottom action sheet.

## Unresolved

- Mobile has never been captured. The browser automation available here renders at a fixed 1366px viewport, so the stacked layout and the action sheet are reasoned from source, not seen. Verify on a real device before treating them as done.
- The visitor/provisional band (`--provisional`, ochre) is defined in the token system and used for the reading lamp, but no surface yet distinguishes a guest session from a full account. The guest path is real and the band is the obvious place to say so.
- Revoked members disappear from the roster because the data does not retain them. The world wants them struck and stamped in place as an audit record; that needs a server-side change before the UI can honour it.
