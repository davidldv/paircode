# PairCode — C4 Architecture

Two C4 levels: **System Context** (who uses it, what it depends on) and **Containers** (what processes/stores make up the system, and how they talk).

Diagrams use Mermaid's C4 syntax — they render on GitHub, in most Markdown viewers, and in [mermaid.live](https://mermaid.live).

---

## Level 1 — System Context

```mermaid
flowchart TB
    user(["<b>User</b><br/><span style='font-size:12px'>Owner · Collaborator · Viewer</span><br/><span style='font-size:11px;opacity:0.75'>Browser-based</span>"])

    paircode["<b>PairCode</b><br/><span style='font-size:12px'>Real-time collaborative coding<br/>workspace with AI pair programmer</span><br/><span style='font-size:11px;opacity:0.8'>Owns auth, session &amp; realtime layers</span>"]

    gemini[/"<b>Google Gemini API</b><br/><span style='font-size:12px;opacity:0.85'>External LLM</span><br/><span style='font-size:11px;opacity:0.7'>OpenAI-compatible /chat/completions</span>"/]

    user  -- "<b>HTTPS + WSS</b><br/><span style='font-size:11px'>Sign in · join rooms · chat with AI</span>" --> paircode
    paircode -- "<b>HTTPS · SSE</b><br/><span style='font-size:11px'>Prompts → token stream</span>" --> gemini

    classDef person  fill:#08427b,stroke:#0b4884,color:#fff,stroke-width:2px,rx:14,ry:14
    classDef system  fill:#1168bd,stroke:#0d5ba8,color:#fff,stroke-width:2.5px
    classDef ext     fill:#6b7280,stroke:#4b5563,color:#fff,stroke-width:1.5px,stroke-dasharray:4 3

    class user person
    class paircode system
    class gemini ext

    linkStyle default stroke:#9ca3af,stroke-width:1.4px,color:#e5e7eb
```

**Notes**
- PairCode is a single product boundary; everything inside (web, API, realtime, DB) is owned by us.
- Gemini is the only outbound third party in the security perimeter. Its API key never leaves the WebSocket server process.

---

## Level 2 — Containers

```mermaid
flowchart TB
    user(["<b>User</b><br/><span style='font-size:11px;opacity:0.8'>Browser</span>"])

    subgraph paircode ["&nbsp;PairCode&nbsp;"]
        direction TB
        spa["<b>Web App</b><br/><span style='font-size:11px'>Next.js 16 · React 19</span><br/><span style='font-size:11px;opacity:0.8'>SPA + SSR · sign-in / room UI</span>"]

        subgraph services [" "]
            direction LR
            api["<b>HTTP API</b><br/><span style='font-size:11px'>Next.js Route Handlers</span><br/><span style='font-size:11px;opacity:0.8'>Auth · WS tickets · CSRF · rate-limit</span>"]
            ws["<b>Realtime Server</b><br/><span style='font-size:11px'>Bun + ws · :3001</span><br/><span style='font-size:11px;opacity:0.8'>Rooms · presence · per-event RBAC</span>"]
        end

        db[("<b>PostgreSQL</b><br/><span style='font-size:11px'>Prisma 7</span><br/><span style='font-size:11px;opacity:0.8'>Users · Sessions · Rooms · SecurityEvents</span>")]
    end

    gemini[/"<b>Gemini API</b><br/><span style='font-size:11px;opacity:0.85'>External LLM</span>"/]

    user -- "<b>HTTPS</b><br/><span style='font-size:11px'>UI</span>" --> spa
    user -- "<b>HTTPS</b><br/><span style='font-size:11px'>Auth · cookies + CSRF</span>" --> api
    user -- "<b>WSS</b><br/><span style='font-size:11px'>Ticket → room events</span>" --> ws

    spa -. "fetch / forms" .-> api
    api -- "Prisma" --> db
    ws  -- "Prisma" --> db
    ws  -- "<b>HTTPS · SSE</b><br/><span style='font-size:11px'>Chat completions stream</span>" --> gemini

    classDef person    fill:#08427b,stroke:#0b4884,color:#fff,stroke-width:2px,rx:14,ry:14
    classDef container fill:#1168bd,stroke:#0d5ba8,color:#fff,stroke-width:2px
    classDef database  fill:#0d5ba8,stroke:#0a4880,color:#fff,stroke-width:2px
    classDef ext       fill:#6b7280,stroke:#4b5563,color:#fff,stroke-width:1.5px,stroke-dasharray:4 3

    class user person
    class spa,api,ws container
    class db database
    class gemini ext

    style paircode fill:transparent,stroke:#9ca3af,stroke-width:1.5px,stroke-dasharray:6 4,color:#e5e7eb
    style services fill:transparent,stroke:transparent

    linkStyle default stroke:#9ca3af,stroke-width:1.4px,color:#e5e7eb
```

---

## Container responsibilities (what each box owns)

| Container | Owns | Does NOT own |
|---|---|---|
| **Web App** | UI, routing, optimistic state, WS client | Authorization, secrets, session truth |
| **HTTP API** | Credential verification (Argon2id), JWT minting (EdDSA via `jose`), refresh-token rotation with reuse detection, CSRF token mint/verify, WS ticket issuance, rate limiting, security event logging | Long-lived realtime connections |
| **Realtime Server** | WS handshake (single-use ticket → session), room state in memory, per-event RBAC, message persistence, AI relay, rate limiting | Password verification, JWT minting |
| **PostgreSQL** | Source of truth: identity, sessions, refresh-token chain, room membership, message history, security audit log | Application logic — pure data |

---

## Two flows worth knowing for a review

### Login → first WebSocket connection

```mermaid
%%{init: {'theme':'dark','themeVariables':{'primaryColor':'#1168bd','primaryBorderColor':'#0d5ba8','primaryTextColor':'#fff','actorBkg':'#1168bd','actorBorder':'#0d5ba8','actorTextColor':'#fff','signalColor':'#cbd5e1','signalTextColor':'#e5e7eb','noteBkgColor':'#1f2937','noteTextColor':'#e5e7eb','noteBorderColor':'#374151','sequenceNumberColor':'#0b1220'}}}%%
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 🔐 HTTP API
    participant D as 🗄 PostgreSQL
    participant R as ⚡ Realtime

    rect rgba(17, 104, 189, 0.12)
        Note over U,D: Phase 1 — Login
        U->>+A: POST /api/auth/login
        A->>A: Rate-limit (IP + account)
        A->>D: Read user · check lockout
        A->>A: Argon2id verify
        A->>D: Create Session + hashed RefreshToken
        A-->>-U: Set HttpOnly cookies<br/>(access JWT EdDSA · refresh · CSRF)
    end

    rect rgba(107, 114, 128, 0.18)
        Note over U,D: Phase 2 — WS ticket
        U->>+A: POST /api/ws/ticket<br/>(cookies + CSRF header)
        A->>D: Insert WsTicket (hashed · short TTL)
        A-->>-U: { ticket, expiresAt }
    end

    rect rgba(16, 185, 129, 0.12)
        Note over U,R: Phase 3 — Realtime handshake
        U->>+R: WSS connect (ticket in handshake)
        R->>D: Redeem ticket (single-use)<br/>load active Session
        R->>D: Authorize room join<br/>(membership + role)
        R-->>-U: room.snapshot → event stream
    end
```

### AI assist inside a room

```mermaid
%%{init: {'theme':'dark','themeVariables':{'primaryColor':'#1168bd','primaryBorderColor':'#0d5ba8','primaryTextColor':'#fff','actorBkg':'#1168bd','actorBorder':'#0d5ba8','actorTextColor':'#fff','signalColor':'#cbd5e1','signalTextColor':'#e5e7eb','noteBkgColor':'#1f2937','noteTextColor':'#e5e7eb','noteBorderColor':'#374151','sequenceNumberColor':'#0b1220'}}}%%
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant R as ⚡ Realtime
    participant D as 🗄 PostgreSQL
    participant G as 🤖 Gemini

    U->>+R: agent.invoke<br/>(room context + prompt)

    rect rgba(17, 104, 189, 0.12)
        Note over R: Authorize
        R->>R: RBAC (collaborator+)<br/>per-user rate limit
    end

    R->>D: Persist user message

    rect rgba(16, 185, 129, 0.12)
        Note over R,G: Stream completion
        R->>+G: POST /chat/completions<br/>(stream=true)
        G-->>R: SSE token stream
        loop per token chunk
            R-->>U: room.message.delta
        end
        G-->>-R: stream end
    end

    R->>D: Persist final message<br/>+ audit metadata
    R-->>-U: room.message.done
```

---

## Cross-cutting concerns

- **Authentication.** EdDSA-signed JWTs (short-lived access, ~minutes) + rotating refresh tokens stored hashed with `replacedById` chain to detect reuse. Sessions can be revoked server-side (`Session.revokedAt`); JWT verification additionally checks an in-DB `credentialVersion` to invalidate all tokens on password change.
- **Authorization.** Room-level RBAC (`owner` / `collaborator` / `viewer`) checked **per WebSocket event**, not just at handshake. HTTP routes use a `requireUser` guard.
- **CSRF.** Double-submit token: HttpOnly cookie + header on every state-changing HTTP request. WS handshake instead uses the single-use ticket pattern, which is not vulnerable to CSRF.
- **Rate limiting.** Token-bucket keyed by IP, account, or userId. Applied on login, signup, refresh, ws-ticket issuance, and per-event on the WS server.
- **Audit trail.** `SecurityEvent` table indexed on `(kind, at)` and `(userId, at)` records auth attempts, ticket issuance/redemption, room access decisions, rate-limit trips.
- **Secrets.** JWT private key on disk (`jwt-private.pem`), public key distributed to verifiers. Gemini key only in the realtime server process. `INVITE_SIGNING_SECRET` required at boot.

---

## Trust boundaries (what a reviewer would draw red lines around)

1. **Browser ↔ HTTP API** — credentials cross here; everything else relies on cookies + CSRF.
2. **Browser ↔ Realtime Server** — single-use ticket is the only thing carrying identity across this boundary; ticket is hashed in DB and consumed atomically on redeem.
3. **Realtime Server ↔ Gemini** — outbound only; user content leaves the perimeter, so prompt content is the place to apply LLM guardrails / prompt-injection defenses.
4. **App ↔ PostgreSQL** — least-privilege DB role; all queries via Prisma (parameterized).

---

## What this diagram deliberately does NOT show

- Component-level (C4 L3) breakdown of `lib/auth/*` and `server/security/*` — would be a separate diagram per container.
- Deployment topology (C4 L4) — single Postgres, two Node processes today; would be one Mermaid block if needed for an ops review.
- Frontend state management — irrelevant to a security/architecture review.
