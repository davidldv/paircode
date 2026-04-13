import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { logSecurityEvent } from "@/lib/logging/logger";

import { REFRESH_TTL_SECONDS } from "./env";
import { hashOpaqueToken, issueOpaqueToken, signAccessToken } from "./jwt";

type PrismaTx = Prisma.TransactionClient;

export class RefreshError extends Error {
  constructor(
    readonly code: "refresh_invalid" | "refresh_reuse" | "refresh_expired" | "refresh_session_revoked",
  ) {
    super(code);
  }
}

export async function issueSessionTokens(userId: string, meta: { ipHash: string; userAgent: string }) {
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credentialVersion: true },
    });
    if (!user) throw new Error("user_not_found");

    const session = await tx.session.create({
      data: {
        userId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
      },
    });

    const refresh = issueOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    await tx.refreshToken.create({
      data: {
        sessionId: session.id,
        tokenHash: refresh.hash,
        expiresAt,
      },
    });

    const access = await signAccessToken({
      sub: userId,
      sid: session.id,
      ver: user.credentialVersion,
    });

    return {
      sessionId: session.id,
      accessJwt: access.jwt,
      refreshToken: refresh.raw,
      refreshExpiresAt: expiresAt,
    };
  });
}

export async function rotateRefreshToken(rawInbound: string) {
  const inboundHash = hashOpaqueToken(rawInbound);

  return prisma.$transaction(async (tx: any) => {
    const current = await tx.refreshToken.findUnique({
      where: { tokenHash: inboundHash },
      include: {
        session: {
          include: {
            user: { select: { id: true, credentialVersion: true } },
          },
        },
      },
    });

    if (!current) {
      throw new RefreshError("refresh_invalid");
    }

    if (current.session.revokedAt) {
      throw new RefreshError("refresh_session_revoked");
    }

    if (current.usedAt) {
      await tx.session.update({
        where: { id: current.sessionId },
        data: { revokedAt: new Date() },
      });
      await logSecurityEvent(
        {
          kind: "auth.refresh.reuse_detected",
          severity: "crit",
          userId: current.session.userId,
          sessionId: current.sessionId,
          metadata: { refreshTokenId: current.id },
        },
        tx,
      );
      throw new RefreshError("refresh_reuse");
    }

    if (current.expiresAt < new Date()) {
      throw new RefreshError("refresh_expired");
    }

    const next = issueOpaqueToken();
    const nextExpiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
    const nextRow = await tx.refreshToken.create({
      data: {
        sessionId: current.sessionId,
        tokenHash: next.hash,
        expiresAt: nextExpiresAt,
      },
    });
    await tx.refreshToken.update({
      where: { id: current.id },
      data: { usedAt: new Date(), replacedById: nextRow.id },
    });
    await tx.session.update({
      where: { id: current.sessionId },
      data: { lastSeenAt: new Date() },
    });

    const access = await signAccessToken({
      sub: current.session.userId,
      sid: current.sessionId,
      ver: current.session.user.credentialVersion,
    });

    return {
      sessionId: current.sessionId,
      userId: current.session.userId,
      accessJwt: access.jwt,
      refreshToken: next.raw,
      refreshExpiresAt: nextExpiresAt,
    };
  });
}

export async function revokeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}
