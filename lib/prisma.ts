// lib/prisma.ts
import { PrismaClient } from "./generated/prisma";
import { withOptimize } from "@prisma/extension-optimize";

const createPrismaClient = () =>
  new PrismaClient().$extends(
    withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
  );

const globalForPrisma = global as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = prisma;
