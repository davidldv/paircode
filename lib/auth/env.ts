function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizedMultilineSecret(name: string): string {
  const raw = required(name).trim();
  const unquoted =
    (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw;
  return unquoted
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\\n/g, "\n")
    .trim();
}

export const AUTH_ENV = {
  get jwtPrivateKey() {
    return normalizedMultilineSecret("JWT_PRIVATE_KEY");
  },
  get jwtPublicKey() {
    return normalizedMultilineSecret("JWT_PUBLIC_KEY");
  },
  get jwtKid() {
    return required("JWT_KID");
  },
  get ipHashPepper() {
    return required("IP_HASH_PEPPER");
  },
  get inviteSigningSecret() {
    return required("INVITE_SIGNING_SECRET");
  },
} as const;

export const ACCESS_TTL_SECONDS = 60 * 10;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14;
export const WS_TICKET_TTL_SECONDS = 30;

/**
 * A cookie name prefix is a contract with the browser, not decoration:
 *
 *   __Host-    requires Secure, Path=/, and no Domain
 *   __Secure-  requires Secure
 *
 * A prefixed cookie that breaks its contract is dropped silently. There is no
 * error and no warning — the Set-Cookie header simply has no effect, and the
 * next request arrives unauthenticated. That makes the prefix and the Secure
 * attribute a single decision, which is why they are derived here together
 * rather than set independently at each call site.
 *
 * Production is always secure. A dev server behind HTTPS can opt in with
 * COOKIE_SECURE=true; nothing can opt production out.
 */
export const SECURE_COOKIES =
  process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

/**
 * The refresh token is scoped to the auth endpoints so it never rides along on
 * ordinary requests. That narrowing is worth more than __Host-'s Path=/
 * guarantee, so the refresh cookie takes __Secure- instead.
 */
export const REFRESH_COOKIE_PATH = "/api/auth";

export function cookieNamesFor(secure: boolean) {
  return {
    access: secure ? "__Host-paircode_access" : "paircode_access",
    refresh: secure ? "__Secure-paircode_refresh" : "paircode_refresh",
    // The double-submit check needs the client to read this one, so it is
    // never httpOnly and never prefixed.
    csrf: "paircode_csrf",
  } as const;
}

export const COOKIE_NAMES = cookieNamesFor(SECURE_COOKIES);
