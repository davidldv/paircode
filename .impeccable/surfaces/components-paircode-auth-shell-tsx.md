---
version: 1
slug: "components-paircode-auth-shell-tsx"
primary_target: "components/paircode/auth-shell.tsx"
related_targets: []
---

## Scope and mode

The door: sign-in, sign-up, and the shared `AuthShell` they both render into. Visitor mode: **Persuade**, executed inside the room's own Operate world rather than as a separate marketing skin.

## Audience and job

This is the first screen a hiring manager sees, usually before they have any reason to care. Its job is to make the offer intelligible in one line, expose one obvious action, and demonstrate something only this product can prove — then get out of the way.

The action that matters most is **Issue a visitor pass**. Most reviewers will never create an account, so the guest path is the primary conversion, not a fallback. It is labelled as what it actually is: a real, short-lived guest session, not a demo mode.

## Proof

The left column carries a **conformance table** — what the door enforces, and the file in this repository that enforces it: Argon2id, EdDSA (Ed25519) JWTs, rotated refresh tokens with reuse detection, CSRF double-submit, a single-use socket ticket redeemed by delete, server-side RBAC on every event. Every row was verified against the source before it shipped. This replaces the four identical icon-and-heading capability cards the surface used to carry, which asserted qualities instead of showing them.

Nothing here may be softened into a claim the code does not make, and nothing may be added to it that a reader could not go and check.

## Memorable moment

The form is a blank credential that fills in as the applicant types: the name lands on the bearer line, and the guilloché portrait engraves itself from the email the moment one is entered. Signing up is watching your own credential get printed.

## Constraints that shaped it

- The masthead band is identical to the room's, so the door and the room are visibly the same document.
- No fabricated commercial claims exist anywhere on this surface — no customers, counts, testimonials, pricing, benchmarks or certifications. PRODUCT.md records these as absent and they must stay absent.
- Error states speak in the world's voice: a `Refused` label and the reason, never a generic alert.

## Unresolved

- Mobile is unverified for the same harness reason as the room; the two-column grid collapses at `lg` but has not been seen.
- The visitor pass is described in copy but not yet drawn as one. Issuing it could print a provisional credential with the ochre band before the redirect — the strongest available use of a token role that currently only lights a lamp.
