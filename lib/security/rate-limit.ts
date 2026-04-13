type Bucket = {
  tokens: number;
  updatedAt: number;
};

type LimiterConfig = {
  capacity: number;
  refillPerSecond: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function consumeToken(key: string, config: LimiterConfig, cost = 1): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: config.capacity, updatedAt: now };

  const elapsedSec = (now - bucket.updatedAt) / 1000;
  const refill = elapsedSec * config.refillPerSecond;
  bucket.tokens = Math.min(config.capacity, bucket.tokens + refill);
  bucket.updatedAt = now;

  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens, retryAfterMs: 0 };
  }

  buckets.set(key, bucket);
  const deficit = cost - bucket.tokens;
  const retryAfterMs = Math.ceil((deficit / config.refillPerSecond) * 1000);
  return { allowed: false, remaining: bucket.tokens, retryAfterMs };
}

export const RATE_LIMITS = {
  loginPerIp: { capacity: 10, refillPerSecond: 10 / 60 },
  loginPerAccount: { capacity: 5, refillPerSecond: 5 / 60 },
  signupPerIp: { capacity: 5, refillPerSecond: 5 / 300 },
  refreshPerIp: { capacity: 30, refillPerSecond: 30 / 60 },
  wsTicketPerUser: { capacity: 20, refillPerSecond: 20 / 60 },
  agentPerUser: { capacity: 3, refillPerSecond: 1 / 10 },
  wsNewConnectionPerIp: { capacity: 20, refillPerSecond: 20 / 60 },
  wsChatPerUser: { capacity: 20, refillPerSecond: 20 },
  wsContextPerUser: { capacity: 5, refillPerSecond: 5 / 60 },
  wsAiAskPerUser: { capacity: 2, refillPerSecond: 1 / 10 },
  wsInvitePerUser: { capacity: 5, refillPerSecond: 5 / 60 },
  wsMembershipPerUser: { capacity: 10, refillPerSecond: 10 / 60 },
} as const satisfies Record<string, LimiterConfig>;

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.updatedAt < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();
