import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a function to get Prisma client lazily
function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? 
  (process.env.DATABASE_URL ? createPrismaClient() : {} as PrismaClient);

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
} 