import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 503 });
    }

    console.log('DATABASE_URL is set, testing connection...');
    
    // Test the database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 503 });
    }

    console.log('Creating tables...');
    
    // This will create the tables if they don't exist
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

    console.log('Database setup completed successfully');
    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 