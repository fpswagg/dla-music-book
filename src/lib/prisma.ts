import { PrismaClient } from "@prisma/client";
import { hasDatabase } from "./env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient | null {
  if (!hasDatabase()) return null;
  return globalForPrisma.prisma ?? new PrismaClient();
}

export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
