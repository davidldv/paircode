const buckets = new Map();

export function consumeToken(key, config, cost = 1) {
  const now = Date.now();
  const existing = buckets.get(key);
  const bucket = existing ?? { tokens: config.capacity, updatedAt: now };

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
  wsNewConnectionPerIp: { capacity: 20, refillPerSecond: 20 / 60 },
  wsChatPerUser:        { capacity: 20, refillPerSecond: 20 },
  wsTypingPerUser:      { capacity: 30, refillPerSecond: 30 },
  wsContextPerUser:     { capacity: 5,  refillPerSecond: 5 / 60 },
  wsAiAskPerUser:       { capacity: 2,  refillPerSecond: 1 / 10 },
  wsInvitePerUser:      { capacity: 5,  refillPerSecond: 5 / 60 },
  wsMembershipPerUser:  { capacity: 10, refillPerSecond: 10 / 60 },
};

const interval = setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (bucket.updatedAt < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000);
if (typeof interval.unref === "function") interval.unref();
