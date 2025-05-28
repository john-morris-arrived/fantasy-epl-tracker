import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    const transfers = await prisma.transfer.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 