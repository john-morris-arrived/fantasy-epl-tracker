import { PrismaClient } from '@prisma/client';

async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Setting up database...');
    
    // Create tables using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Squad" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Goalkeeper" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "addedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "squadId" INTEGER NOT NULL UNIQUE,
        FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Team" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "addedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "squadId" INTEGER NOT NULL,
        FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Player" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "addedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "squadId" INTEGER NOT NULL,
        FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Transfer" (
        "id" SERIAL PRIMARY KEY,
        "squadId" INTEGER NOT NULL,
        "squadName" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "playerId" INTEGER NOT NULL,
        "playerName" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE
      );
    `;

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 