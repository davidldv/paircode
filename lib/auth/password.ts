import { hash, verify } from "@node-rs/argon2";

const ARGON2ID_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, ARGON2ID_OPTIONS);
}

export async function verifyPassword(storedHash: string, plaintext: string): Promise<boolean> {
  try {
    return await verify(storedHash, plaintext);
  } catch {
    return false;
  }
}

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 256;

export function assertStrongPassword(plaintext: string): void {
  if (typeof plaintext !== "string") {
    throw new Error("password must be a string");
  }
  if (plaintext.length < PASSWORD_MIN) {
    throw new Error(`password must be at least ${PASSWORD_MIN} characters`);
  }
  if (plaintext.length > PASSWORD_MAX) {
    throw new Error(`password must be at most ${PASSWORD_MAX} characters`);
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(plaintext)).length;
  if (classes < 3) {
    throw new Error("password must include at least 3 of: lowercase, uppercase, digit, symbol");
  }
}
