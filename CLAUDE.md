# PairCode — Engineering & Security Context

## Overview

PairCode is a real-time collaborative coding platform with:

- Live presence via WebSockets
- Persistent room state and history
- AI-assisted collaboration
- Multi-user shared context

Architecture:

- Next.js (frontend + HTTP/SSE endpoints)
- Dedicated WebSocket server (Node.js)
- PostgreSQL (Prisma ORM)

---

## Engineering Philosophy

This project is designed to demonstrate:

- Production-grade backend architecture
- Secure real-time communication
- Explicit handling of identity and access control
- Defense against real-world attack vectors

We do NOT rely on third-party abstractions for core security.

---

## Security Principles

### 1. Zero Trust (Frontend)
The frontend is never trusted.
All identity and authorization checks happen in the backend.

### 2. Explicit Authentication
- JWT-based authentication
- Short-lived access tokens
- Refresh token rotation
- Secure session handling

### 3. WebSocket Security
- Authenticated handshake
- Per-event authorization
- Room-level access validation
- Protection against IDOR

### 4. RBAC (Role-Based Access Control)
Roles:
- owner
- collaborator
- viewer

Permissions are enforced on every action.

---

## Threat Model (Simplified)

Primary threats considered:

- Unauthorized room access (IDOR)
- Token theft / replay attacks
- Malicious WebSocket event injection
- XSS via shared code/editor
- Abuse via high-frequency requests (rate limiting)

---

## Security Measures

- Strict input validation (Zod)
- Structured logging of security events
- Rate limiting (HTTP + WebSocket)
- Secure headers (CSP, etc.)
- Token verification on every request
- Session invalidation support

---

## Logging

We log:

- Authentication attempts
- Token validation failures
- WebSocket connection attempts
- Room access decisions
- Suspicious behavior patterns

Logs are structured and designed for monitoring and auditing.

---

## Project Goals

This is not just a feature demo.

It is a demonstration of:

- Secure system design
- Real-time architecture under constraints
- Backend ownership beyond frameworks

---

## Future Improvements

- Distributed WebSocket scaling
- Advanced anomaly detection
- End-to-end encryption experiments
- Security testing automation

---

## Notes for Contributors (or reviewers)

- Do not introduce implicit trust assumptions
- All new features must pass security validation
- Prefer explicit over abstracted logic
- Security > convenience

---