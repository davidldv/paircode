# PairCode Room

Real-time AI pair-programming room built with Next.js, WebSockets, and streaming AI responses.

## Features

- Live room presence (join/leave)
- Typing indicators
- Shared room chat stream
- Shared room context (`selected files/snippets` + `pinned requirements`)
- Room agent that can:
	- answer room questions
	- summarize room thread
	- propose next steps
	- stream tokens live to everyone in the room

## Architecture

- Next.js app UI: `app/page.tsx`
- WebSocket room server: `server/ws-server.mjs`
- Optional HTTP AI streaming endpoint (SSE): `app/api/agent/route.ts`

Room state is in-memory on the WebSocket server.

## Environment variables

Copy the example file (optional):

```bash
cp .env.example .env.local
```

Then edit `.env.local` as needed:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_PORT=3001
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

If `OPENAI_API_KEY` is not set, the room agent uses a deterministic fallback stream so the app still works.

## Run locally

```bash
bun install
bun run dev
```

This starts both:

- Next.js on `http://localhost:3000`
- WebSocket server on `ws://localhost:3001`

Open multiple browser windows to simulate multiple users in the same room.

## Scripts

- `bun run dev` → starts Next.js + WebSocket server
- `bun run build` → production build
- `bun run start` → starts Next.js + WebSocket server in production mode
- `bun run lint` → ESLint
