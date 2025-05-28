import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
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
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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