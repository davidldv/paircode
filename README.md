# PairCode

Collaborative engineering room with persistent threaded context, live presence, AI facilitation, and room-level implementation history. Built with Next.js, Bun, WebSockets, PostgreSQL (Supabase), and streaming AI responses.

> **Auth note:** PairCode runs its own authentication stack — no third-party auth provider. JWT (EdDSA), refresh token rotation, CSRF protection, Argon2id password hashing, and WebSocket ticket auth are all implemented in-house.

## Features

- Persistent room timeline with chat, AI output, and system audit events
- Live room presence with typing indicators and join/leave awareness
- Shared threaded room context (`selected files/snippets` + `pinned requirements`)
- Custom JWT-authenticated workspace access and verified operator identity
- Explicit room membership with owner-issued signed invite links
- Room-level implementation history that survives reconnects and restarts
- Guest access — try the platform without creating an account
- Room agent that can:
  - answer room questions
  - summarize room thread
  - propose next steps
  - stream tokens live to everyone in the room

## Architecture

- Next.js app UI: `app/page.tsx`
- Auth middleware / route protection: `proxy.ts`
- WebSocket room server: `server/ws-server.mjs`
- Prisma persistence layer: `server/room-store.mjs`
- Prisma client setup: `server/db.mjs` + `prisma.config.ts`
- Optional HTTP AI streaming endpoint (SSE): `app/api/agent/route.ts`

Room presence stays in-memory on the WebSocket server for active socket tracking.
Room messages, system events, and shared room context are persisted to Postgres through Prisma, so room history survives server restarts.
All identity and authorization checks happen in the backend — the frontend is never trusted.

### Realtime Room Flow

1. The auth middleware protects the app shell. Custom auth pages route operators through `/sign-in` and `/sign-up`.
2. The client requests a short-lived access token (10-minute JWT) and a one-time WebSocket ticket (30-second TTL) before joining a room.
3. `server/ws-server.mjs` redeems the WS ticket (single-use, deleted on redeem) and verifies the session before the socket is admitted.
4. `server/room-store.mjs` creates new rooms under the creator, or requires an existing membership or valid signed invite link before an operator can join a restricted room.
5. Active presence stays in-memory for low-latency broadcasts, while chat messages, AI output, and shared room context are written to Postgres.
6. Owner-only actions such as shared context updates, room-agent runs, member removal, and invite generation are enforced on the WebSocket server, not just in the UI.

### Persistence Boundaries

- In-memory only: active sockets, live presence roster, current typing state, active AI stream bookkeeping.
- Postgres via Prisma: user accounts, sessions, refresh tokens, WS tickets, room records, room owner identity, room memberships, active invite records, persisted chat/AI/system audit messages, selected files, pinned requirements, security event log.

### Restricted Room Access

- Joining a brand-new room creates it and assigns the creator as owner.
- Joining an existing room requires either prior membership or a valid signed invite link from the owner.
- After a successful invite-based join, that operator becomes a persisted member and can rejoin later without reopening the invite.
- Invite links are rotated by the owner from inside the room UI and expire automatically after seven days.
- The owner can remove members from the room access list, which immediately revokes future joins and disconnects any active sessions for that user.

### Audit Trail

- Access-changing actions such as room creation, invite rotation, invite-based membership grants, and member removal are persisted as system audit messages in the room history.
- Security events (auth attempts, token failures, reuse detection, suspicious patterns) are persisted to a separate `SecurityEvent` table and emitted as structured JSON logs.
- These audit messages are broadcast live and remain visible after reconnects because they are stored alongside the normal chat stream.

---

## Security

PairCode implements its own production-grade auth stack. No third-party auth provider is used.

### Authentication

- **Argon2id password hashing** — `@node-rs/argon2` with OWASP-recommended params (19 MB memory, 2 iterations). Passwords validated for strength (12–256 chars, 3 of 4 character classes) before hashing.
- **EdDSA JWT access tokens** — signed with an Ed25519 keypair. 10-minute TTL, verified on every request. Claims include `sub`, `sid` (session ID), `ver` (credential version for instant invalidation), and a unique `jti`.
- **Opaque refresh tokens** — 32-byte random tokens stored only as SHA-256 hashes in Postgres. 14-day TTL. Rotated on every use (token family rotation).
- **Refresh token reuse detection** — if a previously-used refresh token is presented, the entire session is immediately revoked and the event is logged as `auth.refresh.reuse_detected` at `crit` severity.
- **CSRF protection** — `x-csrf-token` header verified on all mutating requests. Tokens are minted server-side and stored in a non-httpOnly cookie for JS access.
- **Secure cookie config** — access and refresh tokens set as `HttpOnly`, `Secure` (production), `SameSite=Lax/Strict`. Refresh token path is scoped to `/api/auth` to minimize exposure. `__Host-` prefix enforced in production.
- **Guest access** — ephemeral guest sessions backed by the same session/token machinery as registered users, without requiring an account.

### WebSocket Auth

- **One-time WS tickets** — before opening a socket, the client calls `/api/ws` to get a 30-second single-use ticket (32 bytes random, stored as SHA-256 hash). The ticket is deleted from the DB on first use, making replay impossible.
- **Per-event authorization** — every WebSocket message is checked against room membership and RBAC role before being processed.
- **Credential version invalidation** — changing a password bumps `credentialVersion`. Access tokens carrying a stale `ver` are rejected, forcing re-authentication across all sessions.

### Rate Limiting

Token-bucket rate limiting applied at both HTTP and WebSocket layers:

| Limit | Capacity | Refill |
|---|---|---|
| Login per IP | 10 | 10 / 60s |
| Login per account | 5 | 5 / 60s |
| Signup per IP | 5 | 5 / 300s |
| Refresh per IP | 30 | 30 / 60s |
| WS ticket per user | 20 | 20 / 60s |
| Agent per user | 3 | 1 / 10s |
| WS new connection per IP | 20 | 20 / 60s |
| WS chat per user | 20 | 20s |
| WS context update per user | 5 | 5 / 60s |
| WS AI ask per user | 2 | 1 / 10s |
| WS invite per user | 5 | 5 / 60s |
| WS membership action per user | 10 | 10 / 60s |

### RBAC

Three roles enforced on every WebSocket event and HTTP action:

- `owner` — full control: context updates, AI agent, invite management, member removal
- `collaborator` — read/write room content
- `viewer` — read-only

### Input Validation

Strict Zod schemas validate all incoming HTTP request bodies and WebSocket event payloads before any processing occurs.

### Security Logging

All security-relevant events are written to a persistent `SecurityEvent` table and emitted as structured JSON to stdout:

- Auth attempts (login, signup, guest)
- Token validation failures and reuse
- WebSocket connection attempts and rejections
- Room access decisions
- Suspicious behavior (reuse detection, rate limit hits)

---

## Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_PORT=3001
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# JWT auth — generate an Ed25519 keypair
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_KID=your-key-id

# Random secret used to pepper IP address hashes before storage
IP_HASH_PEPPER=use_a_long_random_secret

# Signs room invite links
INVITE_SIGNING_SECRET=use_a_long_random_secret

# Optional: restrict cookie domain in production
# COOKIE_DOMAIN=yourdomain.com

# AI providers (at least one recommended; falls back to deterministic stub if both missing)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

Use your Supabase Postgres connection string for `DATABASE_URL`. If the direct host is unreachable from your local network, use the Supabase session pooler connection string for local Prisma commands.

If no AI provider key is set, the room agent uses a deterministic fallback stream so the app still works.

---

## Run locally

```bash
bun install
cp .env.example .env.local
# edit .env.local with your DB URL, JWT keypair, and secrets
bun run db:generate
bun run db:push
bun run dev
```

This starts:

- Next.js on `http://localhost:3000`
- WebSocket server on `ws://localhost:3001`
- Postgres persistence through your configured Supabase database

Open multiple browser windows to simulate multiple users in the same room.

## Scripts

- `bun run dev` → starts Next.js + the WebSocket server, reusing an already-running listener on `3000` or `3001` instead of hard-failing
- `bun run dev:web` → starts only Next.js in development
- `bun run dev:ws` → starts only the WebSocket server in development
- `bun run build` → production build
- `bun run start` → starts Next.js + WebSocket server in production mode
- `bun run start:web` → starts only Next.js in production mode
- `bun run start:ws` → starts only the WebSocket server in production mode
- `bun run db:generate` → generate Prisma Client using `prisma.config.ts`
- `bun run db:push` → sync the Prisma schema to your configured database
- `bun run lint` → ESLint
- `bun test` → Bun test suite

## Validate Changes

Run the full local validation pass before shipping backend or auth changes:

```bash
bun run lint
bun test
bun run build
```

If you change the Prisma schema, run these first:

```bash
bun run db:generate
bun run db:push
```
