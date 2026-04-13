import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

type Severity = "info" | "warn" | "crit";

export type SecurityEventInput = {
  kind: string;
  severity?: Severity;
  userId?: string | null;
  sessionId?: string | null;
  roomId?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown>;
};

type PrismaLike = Pick<typeof prisma, "securityEvent">;

export async function logSecurityEvent(
  ev: SecurityEventInput,
  tx: PrismaLike = prisma,
): Promise<void> {
  const severity: Severity = ev.severity ?? "info";
  const metadata = ev.metadata ?? {};

  process.stdout.write(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: severity,
      msg: ev.kind,
      userId: ev.userId ?? null,
      sessionId: ev.sessionId ?? null,
      roomId: ev.roomId ?? null,
      ...metadata,
    }) + "\n",
  );

  try {
    await tx.securityEvent.create({
      data: {
        kind: ev.kind,
        severity,
        userId: ev.userId ?? null,
        sessionId: ev.sessionId ?? null,
        roomId: ev.roomId ?? null,
        ipHash: ev.ipHash ?? null,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    process.stderr.write(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "warn",
        msg: "security_event.persist_failed",
        kind: ev.kind,
        error: error instanceof Error ? error.message : String(error),
      }) + "\n",
    );
  }
}
