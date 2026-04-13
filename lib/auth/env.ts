function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const AUTH_ENV = {
  get jwtPrivateKey() {
    return required("JWT_PRIVATE_KEY").replace(/\\n/g, "\n");
  },
  get jwtPublicKey() {
    return required("JWT_PUBLIC_KEY").replace(/\\n/g, "\n");
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
