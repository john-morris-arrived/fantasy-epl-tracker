import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

// Create a function to get Prisma client lazily
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }
  return new PrismaClient().$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? 
  (process.env.DATABASE_URL ? createPrismaClient() : null);

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL && prisma) {
  globalForPrisma.prisma = prisma;
} 