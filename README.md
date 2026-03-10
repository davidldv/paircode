# PairCode

Collaborative engineering room with persistent threaded context, live presence, AI facilitation, and room-level implementation history. Built with Next.js, Bun, Clerk, WebSockets, Supabase Postgres, and streaming AI responses.

## Features

- Persistent room timeline with chat, AI output, and system audit events
- Live room presence with typing indicators and join/leave awareness
- Shared threaded room context (`selected files/snippets` + `pinned requirements`)
- Clerk-authenticated workspace access and verified operator identity
- Explicit room membership with owner-issued signed invite links
- Room-level implementation history that survives reconnects and restarts
- Room agent that can:
  - answer room questions
  - summarize room thread
  - propose next steps
  - stream tokens live to everyone in the room

## Architecture

- Next.js app UI: `app/page.tsx`
- Clerk route protection: `proxy.ts`
- WebSocket room server: `server/ws-server.mjs`
- Prisma persistence layer: `server/room-store.mjs`
- Prisma client setup: `server/db.mjs` + `prisma.config.ts`
- Optional HTTP AI streaming endpoint (SSE): `app/api/agent/route.ts`

Room presence stays in-memory on the WebSocket server for active socket tracking.
Room messages, system events, and shared room context are persisted to Postgres through Prisma, so room history survives server restarts.
Application routes are protected by Clerk, websocket joins verify Clerk session tokens, and room access is enforced with persistent ownership, memberships, and signed invite links.

### Realtime Room Flow

1. Clerk protects the app shell and custom auth pages route operators through `/sign-in` and `/sign-up`.
2. The client loads the authenticated operator from Clerk and requests a short-lived session token before joining a room.
3. `server/ws-server.mjs` verifies that token with Clerk before the socket is allowed into a room.
4. `server/room-store.mjs` creates new rooms under the creator, or requires an existing membership or valid signed invite link before an operator can join a restricted room.
5. Active presence stays in-memory for low-latency broadcasts, while chat messages, AI output, and shared room context are written to Postgres.
6. Owner-only actions such as shared context updates, room-agent runs, member removal, and invite generation are enforced on the websocket server, not just in the UI.

### Persistence Boundaries

- In-memory only: active sockets, live presence roster, current typing state, active AI stream bookkeeping.
- Postgres via Prisma: room records, room owner identity, room memberships, active invite records, persisted chat/AI/system audit messages, selected files, pinned requirements.
- Clerk: authenticated user identity and websocket session-token verification.

### Restricted Room Access

- Joining a brand-new room creates it and assigns the creator as owner.
- Joining an existing room requires either prior membership or a valid signed invite link from the owner.
- After a successful invite-based join, that operator becomes a persisted member and can rejoin later without reopening the invite.
- Invite links are rotated by the owner from inside the room UI and expire automatically after seven days.
- The owner can remove members from the room access list, which immediately revokes future joins and disconnects any active sessions for that user.

### Audit Trail

- Access-changing actions such as room creation, invite rotation, invite-based membership grants, and member removal are persisted as system audit messages in the room history.
- These audit messages are broadcast live and remain visible after reconnects because they are stored alongside the normal chat stream.

## Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` as needed:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_PORT=3001
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
INVITE_SIGNING_SECRET=use_a_long_random_secret_or_fall_back_to_clerk_secret
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash-preview
```

Use your Supabase Postgres connection string for `DATABASE_URL`, for example:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

If the direct host is unreachable from your local network, use the Supabase session pooler connection string instead of the direct host for local Prisma commands.

Set your Clerk publishable and secret keys in `.env.local` before running the app. The custom auth routes live at `/sign-in` and `/sign-up`.
Set `INVITE_SIGNING_SECRET` if you want invite links signed with a secret separate from Clerk. If omitted, the realtime server falls back to `CLERK_SECRET_KEY`.
Set `CLERK_AUTHORIZED_PARTIES` to the browser origin allowed to mint tokens for the realtime workspace. For local development, `http://localhost:3000` is the correct value.

If no AI provider key is set, the room agent uses a deterministic fallback stream so the app still works.

## Run locally

```bash
bun install
cp .env.example .env.local
bun run db:generate
bun run db:push
bun run dev
```

This starts both:

- Next.js on `http://localhost:3000`
- WebSocket server on `ws://localhost:3001`
- Postgres persistence through your configured Supabase database

Open multiple browser windows to simulate multiple users in the same room.

## Scripts

- `bun run dev` → starts Next.js + the websocket server, while reusing an already-running listener on `3000` or `3001` instead of hard-failing
- `bun run dev:web` → starts only Next.js in development
- `bun run dev:ws` → starts only the websocket server in development
- `bun run build` → production build
- `bun run start` → starts Next.js + WebSocket server in production mode
- `bun run start:web` → starts only Next.js in production mode
- `bun run start:ws` → starts only the websocket server in production mode
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
