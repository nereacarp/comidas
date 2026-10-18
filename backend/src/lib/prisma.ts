import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse the client across hot reloads and warm serverless invocations. Neon
// must still be configured with its pooled connection string at runtime.
globalForPrisma.prisma = prisma;

export type PrismaClientType = typeof prisma;
