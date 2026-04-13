import { prisma } from "../db.mjs";

export async function logSecurityEvent(ev) {
  const severity = ev.severity ?? "info";
  const record = {
    kind: ev.kind,
    severity,
    userId: ev.userId ?? null,
    sessionId: ev.sessionId ?? null,
    roomId: ev.roomId ?? null,
    ipHash: ev.ipHash ?? null,
    metadata: ev.metadata ?? {},
  };

  process.stdout.write(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: severity,
      msg: record.kind,
      userId: record.userId,
      sessionId: record.sessionId,
      roomId: record.roomId,
      ...record.metadata,
    }) + "\n",
  );

  try {
    await prisma.securityEvent.create({ data: record });
  } catch (error) {
    process.stderr.write(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "warn",
        msg: "security_event.persist_failed",
        kind: record.kind,
        error: error instanceof Error ? error.message : String(error),
      }) + "\n",
    );
  }
}
