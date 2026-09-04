# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers, technical recruiters, and senior engineers evaluating David Londoño's work as evidence for a Software Engineer / junior AppSec role. They arrive cold, in a browser tab among many, and give the surface roughly a minute before forming a judgment about engineering depth. Most will use the guest session rather than create an account.

Secondary: engineers actually pairing — two or more people in one room discussing an implementation, in a long working session.

## Product Purpose

PairCode is a real-time collaborative engineering room: shared code context, live presence, persistent membership, an AI facilitator working from the room's own context, and durable message history that survives reconnects. It exists to demonstrate production-grade secure real-time system design, owned end to end rather than assembled from third-party abstractions. Success is a reviewer concluding, from the interface alone, that the person who built this can ship secure backend systems.

## Positioning

Core security is written in-house, not delegated: EdDSA JWTs, rotating refresh tokens with reuse detection, Argon2id password hashing, CSRF defense, and a dedicated WebSocket server whose handshake requires a single-use ticket, with RBAC enforced server-side on every event. The room, not the client, is the access-control boundary. A neighboring collaboration tool cannot truthfully claim it re-derived this layer itself.

## Operating Context

- Reviewer path: land on sign-in → guest session → join or create a room → look for evidence of depth.
- Working path: an owner creates a room, pins files and requirements as shared context, issues a signed expiring invite link to a collaborator, and the two hold a threaded discussion while an agent summarizes or proposes next steps.
- Rooms are addressed by short room codes. A second browser tab is the documented way to simulate a second collaborator.
- Sessions are long-lived and reconnect-tolerant; state is persisted in PostgreSQL and replayed on rejoin.

## Capabilities and Constraints

Confirmed functionality (nothing here may be removed by a redesign):

- Email/password sign-up and sign-in, plus one-click guest sessions.
- Join or create a room by code; leave a room. Connection states: idle, connecting, connected, disconnected.
- Live presence roster (socket-level) and persisted room membership roster (database-level) — these are two distinct lists, and the difference is meaningful.
- Roles: owner, collaborator, viewer. Owners alone edit shared context, run the agent, issue invites, and remove members.
- Owner-issued signed invite links with a visible expiry, rotatable; invited operators become persistent members after their first successful join.
- Shared room context: selected files/snippets and pinned requirements, attributed to whoever last updated them.
- Room agent with three modes — ask, summarize, next steps — streaming its response into the message stream.
- Message stream carrying human messages, system events, and agent output, with per-message timestamps and typing indicators.
- Toast notifications, keyboard shortcuts (Shift+M focus message, Shift+J join, Cmd/Ctrl+Enter send or run), light/dark theme, and a mobile command palette.
- Rate limiting on HTTP and WebSocket paths; structured security logging.

Constraints: Next.js 16 App Router + React 19, Tailwind v4, Radix primitives, lucide-react icons, Prisma/PostgreSQL, a separate Node/Bun WebSocket server. Theme preference persists client-side.

## Brand Commitments

The name **PairCode** is fixed. The existing mark (`public/brand/paircode-mark.svg`) is the incumbent asset; the user authorized replacing the visual world, so a replacement mark may ship at the same path.

Voice: precise, operational, unhyped. The product speaks in engineering nouns — room, operator, member, context, event — and never in marketing superlatives.

## Evidence on Hand

Real: the running application and every capability above; `docs/architecture-c4.md` with four architecture diagrams; `CLAUDE.md` recording the threat model and security measures.

Absent, and never to be fabricated: customers, user counts, testimonials, pricing, uptime or latency benchmarks, security certifications, press. Any figure a visitor could read as a commercial claim must be real or clearly labeled as sample data.

## Product Principles

1. The frontend is never the authority. Anything the interface shows about identity or permission reflects a server-side decision, and the interface should make that visible rather than imply client-side trust.
2. Presence and membership are different facts. Never collapse "connected right now" into "belongs to this room."
3. Permission is the interface. Owner-only capabilities are shown in their real state — present and disabled with a reason, not hidden — so the access model is legible.
4. Depth must be legible in under a minute. A reviewer who never signs up should still see the security model working.
5. Evidence over claims. Show the mechanism operating; never assert quality the product cannot demonstrate.

## Accessibility & Inclusion

No product-specific standard was established. Baseline: WCAG AA contrast, full keyboard operability of every documented shortcut and control, visible focus, and respect for `prefers-reduced-motion` (already honored in the incumbent CSS).
