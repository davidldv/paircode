import { SignJWT, jwtVerify, importPKCS8, importSPKI, type CryptoKey, type KeyObject } from "jose";
import { createHash, randomBytes } from "node:crypto";

import { ACCESS_TTL_SECONDS, AUTH_ENV, REFRESH_TTL_SECONDS } from "./env";

const ISSUER = "paircode";
const AUDIENCE = "paircode.web";
const ALG = "EdDSA";

type JwtKey = CryptoKey | KeyObject;
type KeyPair = { privateKey: JwtKey; publicKey: JwtKey; kid: string };

let cachedKeys: KeyPair | null = null;

async function loadKeys(): Promise<KeyPair> {
  if (cachedKeys) return cachedKeys;
  const privatePem = AUTH_ENV.jwtPrivateKey;
  const publicPem = AUTH_ENV.jwtPublicKey;

  if (!privatePem.includes("BEGIN PRIVATE KEY")) {
    throw new Error("invalid_jwt_private_key_format");
  }
  if (!publicPem.includes("BEGIN PUBLIC KEY")) {
    throw new Error("invalid_jwt_public_key_format");
  }

  const [privateKey, publicKey] = await Promise.all([
    importPKCS8(privatePem, ALG),
    importSPKI(publicPem, ALG),
  ]);
  cachedKeys = { privateKey, publicKey, kid: AUTH_ENV.jwtKid };
  return cachedKeys;
}

export type AccessClaims = {
  sub: string;
  sid: string;
  ver: number;
  jti: string;
  iat: number;
  exp: number;
};

export async function signAccessToken(input: { sub: string; sid: string; ver: number }) {
  const { privateKey, kid } = await loadKeys();
  const jti = randomBytes(16).toString("base64url");
  const jwt = await new SignJWT({ sid: input.sid, ver: input.ver })
    .setProtectedHeader({ alg: ALG, typ: "JWT", kid })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(input.sub)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(privateKey);
  return { jwt, jti };
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { publicKey } = await loadKeys();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
    clockTolerance: 5,
  });
  if (
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.ver !== "number" ||
    typeof payload.jti !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("malformed_access_token");
  }
  return payload as AccessClaims;
}

export function issueOpaqueToken(bytes = 32): { raw: string; hash: string } {
  const raw = randomBytes(bytes).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashOpaqueToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export { REFRESH_TTL_SECONDS };
