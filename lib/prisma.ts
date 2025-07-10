import { PrismaClient } from "./generated/prisma";
import { withOptimize } from "@prisma/extension-optimize";

function createExtendedPrismaClient() {
  return new PrismaClient().$extends(
    withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
  );
}

const globalForPrisma = global as unknown as {
  prisma?: ReturnType<typeof createExtendedPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createExtendedPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = prisma;
