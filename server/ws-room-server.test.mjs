import { describe, expect, it } from "bun:test";

import {
  createAccessTestStore,
  createInviteTokenForStore,
  createTestHandler,
  FakeSocket,
  getSentMessages,
} from "./ws-room-server.test-helpers.mjs";

function principal(id, name = "User") {
  return {
    userId: `user-${id}`,
    sessionId: `session-${id}`,
    displayName: name,
  };
}

describe("ws room server access control", () => {
  it("denies joining an existing restricted room without a valid invite link", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);
    const guestSocket = new FakeSocket();

    await connect(guestSocket, principal("guest-1", "Guest"));
    await guestSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Guest",
    });

    expect(getSentMessages(guestSocket, "error").at(-1)?.error).toContain("invite link");
    expect(getSentMessages(guestSocket, "room:snapshot")).toHaveLength(0);
  });

  it("allows joining with a valid signed invite link and hides owner-only invite details", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);
    const memberSocket = new FakeSocket();
    const inviteToken = createInviteTokenForStore(store);

    await connect(memberSocket, principal("member-2", "Invited Member"));
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Invited Member",
      inviteToken,
    });

    const snapshot = getSentMessages(memberSocket, "room:snapshot").at(-1);
    expect(snapshot).toBeTruthy();
    expect(snapshot.permissions.canManageRoom).toBe(false);
    expect(snapshot.permissions.role).toBe("collaborator");
    expect(snapshot.activeInvite).toBeNull();
    expect(snapshot.members).toEqual([
      { userId: "user-owner", name: "Owner", role: "owner" },
      { userId: "user-member-2", name: "Invited Member", role: "collaborator" },
    ]);
  });

  it("lets the owner remove a member and disconnects their active sockets", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);
    const ownerSocket = new FakeSocket();
    const memberSocket = new FakeSocket();

    await connect(ownerSocket, { userId: "user-owner", sessionId: "session-owner", displayName: "Owner" });
    await ownerSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Owner",
    });

    await connect(memberSocket, principal("member-3", "Member"));
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Member",
      inviteToken: createInviteTokenForStore(store),
    });

    await ownerSocket.emitMessage({
      type: "membership:remove",
      memberUserId: "user-member-3",
    });

    expect(memberSocket.closed).toBe(true);
    expect(getSentMessages(memberSocket, "error").at(-1)?.error).toContain("revoked");

    const membersUpdate = getSentMessages(ownerSocket, "room:members").at(-1);
    expect(membersUpdate.members).toEqual([{ userId: "user-owner", name: "Owner", role: "owner" }]);
    expect(getSentMessages(ownerSocket, "chat").at(-1)?.message.auditMetadata.kind).toBe("member-removed");
  });

  it("blocks collaborators from updating shared context", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);

    // owner starts the room
    const ownerSocket = new FakeSocket();
    await connect(ownerSocket, { userId: "user-owner", sessionId: "session-owner", displayName: "Owner" });
    await ownerSocket.emitMessage({ type: "join", roomId: "alpha-room", userName: "Owner" });

    // downgrade to viewer so we can test blocking
    store.room.members.push({ userId: "user-viewer", name: "Viewer", role: "viewer" });

    const viewerSocket = new FakeSocket();
    await connect(viewerSocket, principal("viewer", "Viewer"));
    await viewerSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Viewer",
      inviteToken: createInviteTokenForStore(store),
    });

    await viewerSocket.emitMessage({
      type: "context:update",
      context: { selectedFiles: "server/ws-room-server.mjs", pinnedRequirements: "blocked" },
    });

    expect(getSentMessages(viewerSocket, "error").at(-1)?.error).toContain("permission");
    expect(store.room.context).toEqual({ selectedFiles: "", pinnedRequirements: "" });
  });

  it("blocks non-owners from running the room agent", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);

    const ownerSocket = new FakeSocket();
    await connect(ownerSocket, { userId: "user-owner", sessionId: "session-owner", displayName: "Owner" });
    await ownerSocket.emitMessage({ type: "join", roomId: "alpha-room", userName: "Owner" });

    store.room.members.push({ userId: "user-viewer", name: "Viewer", role: "viewer" });
    const viewerSocket = new FakeSocket();
    await connect(viewerSocket, principal("viewer", "Viewer"));
    await viewerSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Viewer",
      inviteToken: createInviteTokenForStore(store),
    });

    await viewerSocket.emitMessage({ type: "ai:ask", mode: "answer", question: "Can I run the agent?" });

    expect(getSentMessages(viewerSocket, "error").at(-1)?.error).toContain("permission");
    expect(getSentMessages(viewerSocket, "ai:start")).toHaveLength(0);
  });

  it("rotates invite links so old tokens stop working and the new token succeeds", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);
    const ownerSocket = new FakeSocket();
    const oldInviteToken = createInviteTokenForStore(store);

    await connect(ownerSocket, { userId: "user-owner", sessionId: "session-owner", displayName: "Owner" });
    await ownerSocket.emitMessage({ type: "join", roomId: "alpha-room", userName: "Owner" });
    await ownerSocket.emitMessage({ type: "invite:create" });

    const inviteCreated = getSentMessages(ownerSocket, "invite:created").at(-1);
    expect(inviteCreated.invite.token).toBeTruthy();
    expect(getSentMessages(ownerSocket, "chat").at(-1)?.message.auditMetadata.kind).toBe("invite-rotated");

    const deniedSocket = new FakeSocket();
    await connect(deniedSocket, principal("old", "Old Link User"));
    await deniedSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Old Link User",
      inviteToken: oldInviteToken,
    });

    expect(getSentMessages(deniedSocket, "error").at(-1)?.error).toContain("invite link");

    const allowedSocket = new FakeSocket();
    await connect(allowedSocket, principal("new", "New Link User"));
    await allowedSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "New Link User",
      inviteToken: inviteCreated.invite.token,
    });

    const snapshot = getSentMessages(allowedSocket, "room:snapshot").at(-1);
    expect(snapshot).toBeTruthy();
    expect(snapshot.members).toEqual([
      { userId: "user-owner", name: "Owner", role: "owner" },
      { userId: "user-new", name: "New Link User", role: "collaborator" },
    ]);
  });

  it("rejects malformed event payloads via Zod validation", async () => {
    const store = createAccessTestStore();
    const { connect } = createTestHandler(store);
    const ownerSocket = new FakeSocket();

    await connect(ownerSocket, { userId: "user-owner", sessionId: "session-owner", displayName: "Owner" });
    await ownerSocket.emitMessage({ type: "join", roomId: "alpha-room", userName: "Owner" });

    // missing "text"
    await ownerSocket.emitMessage({ type: "chat" });
    expect(getSentMessages(ownerSocket, "error").at(-1)?.error).toContain("Invalid event payload");
  });
});
