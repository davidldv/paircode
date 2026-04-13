import { createHash } from "node:crypto";

import { AUTH_ENV } from "./env";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + AUTH_ENV.ipHashPepper).digest("hex");
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
