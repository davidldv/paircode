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
  get cookieDomain() {
    return process.env.COOKIE_DOMAIN ?? undefined;
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
} as const;

export const ACCESS_TTL_SECONDS = 60 * 10;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14;
export const WS_TICKET_TTL_SECONDS = 30;

export const COOKIE_NAMES = {
  access: "__Host-paircode_access",
  refresh: "__Host-paircode_refresh",
  csrf: "paircode_csrf",
} as const;
