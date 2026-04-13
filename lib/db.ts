import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const { Pool } = pg;

type GlobalWithPrisma = typeof globalThis & {
  __paircodePgPool?: InstanceType<typeof Pool>;
  __paircodePrismaAdapter?: PrismaPg;
  __paircodePrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const shouldUseSsl = sslMode === "require" || url.hostname.endsWith(".supabase.co");
  return new Pool({
    connectionString,
    ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

const pool = globalForPrisma.__paircodePgPool ?? createPool();
const adapter = globalForPrisma.__paircodePrismaAdapter ?? new PrismaPg(pool);

export const prisma: PrismaClient =
  globalForPrisma.__paircodePrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__paircodePgPool = pool;
  globalForPrisma.__paircodePrismaAdapter = adapter;
  globalForPrisma.__paircodePrisma = prisma;
}
