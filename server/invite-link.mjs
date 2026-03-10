import { createHmac, timingSafeEqual } from "node:crypto";

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSignedInviteToken({ roomId, inviteCode, expiresAt }, secret) {
  if (!secret) {
    throw new Error("A signing secret is required to create invite links.");
  }

  const payload = encodeBase64Url(JSON.stringify({ roomId, inviteCode, expiresAt }));
  const signature = signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export function verifySignedInviteToken(token, secret) {
  if (!secret || !token) {
    return null;
  }

  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    if (!parsed.roomId || !parsed.inviteCode || !parsed.expiresAt) {
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return {
      roomId: String(parsed.roomId),
      inviteCode: String(parsed.inviteCode),
      expiresAt: String(parsed.expiresAt),
    };
  } catch {
    return null;
  }
}