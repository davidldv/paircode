import { describe, expect, it } from "bun:test";

import {
  createAccessTestStore,
  createInviteTokenForStore,
  createTestHandler,
  FakeSocket,
  getSentMessages,
} from "./ws-room-server.test-helpers.mjs";

describe("ws room server access control", () => {
  it("denies joining an existing restricted room without a valid invite link", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const guestSocket = new FakeSocket();

    handleConnection(guestSocket);
    await guestSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Guest",
      sessionToken: "guest-1",
    });

    expect(guestSocket.closed).toBe(true);
    expect(getSentMessages(guestSocket, "error").at(-1)?.error).toContain("invite link");
    expect(getSentMessages(guestSocket, "room:snapshot")).toHaveLength(0);
  });

  it("allows joining with a valid signed invite link and hides owner-only invite details", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const memberSocket = new FakeSocket();
    const inviteToken = createInviteTokenForStore(store);

    handleConnection(memberSocket);
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Invited Member",
      sessionToken: "member-2",
      inviteToken,
    });

    const snapshot = getSentMessages(memberSocket, "room:snapshot").at(-1);
    expect(snapshot).toBeTruthy();
    expect(snapshot.permissions.canManageRoom).toBe(false);
    expect(snapshot.activeInvite).toBeNull();
    expect(snapshot.members).toEqual([
      { authUserId: "owner-1", name: "Owner" },
      { authUserId: "member-2", name: "Invited Member" },
    ]);
  });

  it("lets the owner remove a member and disconnects their active sockets", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const ownerSocket = new FakeSocket();
    const memberSocket = new FakeSocket();

    handleConnection(ownerSocket);
    await ownerSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Owner",
      sessionToken: "owner-1",
    });

    handleConnection(memberSocket);
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Member",
      sessionToken: "member-3",
      inviteToken: createInviteTokenForStore(store),
    });

    await ownerSocket.emitMessage({
      type: "membership:remove",
      memberAuthUserId: "member-3",
    });

    expect(memberSocket.closed).toBe(true);
    expect(getSentMessages(memberSocket, "error").at(-1)?.error).toContain("revoked");

    const membersUpdate = getSentMessages(ownerSocket, "room:members").at(-1);
    expect(membersUpdate.members).toEqual([{ authUserId: "owner-1", name: "Owner" }]);
    expect(getSentMessages(ownerSocket, "chat").at(-1)?.message.auditMetadata.kind).toBe("member-removed");
  });

  it("blocks non-owners from updating shared context", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const memberSocket = new FakeSocket();

    handleConnection(memberSocket);
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Member",
      sessionToken: "member-4",
      inviteToken: createInviteTokenForStore(store),
    });

    await memberSocket.emitMessage({
      type: "context:update",
      context: {
        selectedFiles: "server/ws-room-server.mjs",
        pinnedRequirements: "Owner approval required",
      },
    });

    expect(getSentMessages(memberSocket, "error").at(-1)?.error).toContain("Only the room owner can update the shared context");
    expect(store.room.context).toEqual({
      selectedFiles: "",
      pinnedRequirements: "",
    });
  });

  it("blocks non-owners from running the room agent", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const memberSocket = new FakeSocket();

    handleConnection(memberSocket);
    await memberSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Member",
      sessionToken: "member-5",
      inviteToken: createInviteTokenForStore(store),
    });

    await memberSocket.emitMessage({
      type: "ai:ask",
      mode: "answer",
      question: "Can I trigger the agent?",
    });

    expect(getSentMessages(memberSocket, "error").at(-1)?.error).toContain("Only the room owner can run the room agent");
    expect(getSentMessages(memberSocket, "ai:start")).toHaveLength(0);
  });

  it("rotates invite links so old tokens stop working and the new token succeeds", async () => {
    const store = createAccessTestStore();
    const handleConnection = createTestHandler(store);
    const ownerSocket = new FakeSocket();
    const oldInviteToken = createInviteTokenForStore(store);

    handleConnection(ownerSocket);
    await ownerSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Owner",
      sessionToken: "owner-1",
    });

    await ownerSocket.emitMessage({
      type: "invite:create",
    });

    const inviteCreated = getSentMessages(ownerSocket, "invite:created").at(-1);
    expect(inviteCreated.invite.token).toBeTruthy();
    expect(getSentMessages(ownerSocket, "chat").at(-1)?.message.auditMetadata.kind).toBe("invite-rotated");

    const deniedSocket = new FakeSocket();
    handleConnection(deniedSocket);
    await deniedSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "Old Link User",
      sessionToken: "member-old",
      inviteToken: oldInviteToken,
    });

    expect(deniedSocket.closed).toBe(true);
    expect(getSentMessages(deniedSocket, "error").at(-1)?.error).toContain("invite link");

    const allowedSocket = new FakeSocket();
    handleConnection(allowedSocket);
    await allowedSocket.emitMessage({
      type: "join",
      roomId: "alpha-room",
      userName: "New Link User",
      sessionToken: "member-new",
      inviteToken: inviteCreated.invite.token,
    });

    const snapshot = getSentMessages(allowedSocket, "room:snapshot").at(-1);
    expect(snapshot).toBeTruthy();
    expect(snapshot.members).toEqual([
      { authUserId: "owner-1", name: "Owner" },
      { authUserId: "member-new", name: "New Link User" },
    ]);
  });
});