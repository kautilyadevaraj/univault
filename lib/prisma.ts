// lib/prisma.ts
import { PrismaClient } from "./generated/prisma";
import { withOptimize } from "@prisma/extension-optimize";

const prisma = new PrismaClient().$extends(
  withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
);

export const db = prisma;
