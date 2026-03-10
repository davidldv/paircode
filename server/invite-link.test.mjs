import { describe, expect, it } from "bun:test";

import { createSignedInviteToken, verifySignedInviteToken } from "./invite-link.mjs";

const SECRET = "test-invite-secret";

describe("invite link helpers", () => {
  it("creates and verifies a signed invite token", () => {
    const token = createSignedInviteToken({
      roomId: "alpha-room",
      inviteCode: "INVITE123456",
      expiresAt: "2030-01-01T00:00:00.000Z",
    }, SECRET);

    expect(verifySignedInviteToken(token, SECRET)).toEqual({
      roomId: "alpha-room",
      inviteCode: "INVITE123456",
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
  });

  it("rejects tampered or expired tokens", () => {
    const validToken = createSignedInviteToken({
      roomId: "alpha-room",
      inviteCode: "INVITE123456",
      expiresAt: "2030-01-01T00:00:00.000Z",
    }, SECRET);

    const expiredToken = createSignedInviteToken({
      roomId: "alpha-room",
      inviteCode: "INVITE123456",
      expiresAt: "2000-01-01T00:00:00.000Z",
    }, SECRET);

    expect(verifySignedInviteToken(`${validToken}x`, SECRET)).toBeNull();
    expect(verifySignedInviteToken(expiredToken, SECRET)).toBeNull();
  });
});