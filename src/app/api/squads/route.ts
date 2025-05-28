import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      console.error('Database not available: DATABASE_URL or prisma client missing');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    // Test the database connection with timeout
    try {
      console.log('Testing database connection...');
      const connectionTest = await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ]);
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 503 });
    }
    
    console.log('Fetching squads from database...');
    const squads = await prisma.squad.findMany({
      include: {
        goalkeeper: true,
        teams: true,
        players: true,
      },
    });
    console.log(`Found ${squads.length} squads`);
    return NextResponse.json(squads);
  } catch (error) {
    console.error('Error fetching squads:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        return NextResponse.json({ 
          error: 'Database configuration error',
          details: error.message 
        }, { status: 503 });
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Database timeout',
          details: 'Database query took too long to respond' 
        }, { status: 504 });
      }
      if (error.message.includes('connection')) {
        return NextResponse.json({ 
          error: 'Database connection error',
          details: error.message 
        }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    const body = await request.json();
    const { name, goalkeeper, teams, players } = body;

    console.log('Creating new squad:', { name, goalkeeper, teams, players });

    const newSquad = await prisma.squad.create({
      data: {
        name,
        goalkeeper: goalkeeper.id ? {
          create: {
            id: goalkeeper.id,
            name: goalkeeper.name,
            addedDate: new Date(goalkeeper.addedDate)
          }
        } : undefined,
        teams: {
          create: teams.map((team: { id: number; name: string; addedDate: string }) => ({
            id: team.id,
            name: team.name,
            addedDate: new Date(team.addedDate)
          }))
        },
        players: {
          create: players.map((player: { id: number; name: string; addedDate: string }) => ({
            id: player.id,
            name: player.name,
            addedDate: new Date(player.addedDate)
          }))
        }
      },
      include: {
        goalkeeper: true,
        teams: true,
        players: true,
      },
    });

    console.log('Squad created successfully:', newSquad);
    return NextResponse.json(newSquad);
  } catch (error) {
    console.error('Error creating squad:', error);
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 