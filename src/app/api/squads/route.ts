import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

type CreateSquadData = {
  name: string;
  goalkeeper: {
    id: number;
    name: string;
    addedDate: string;
  };
  teams: Array<{
    id: number;
    name: string;
    addedDate: string;
  }>;
  players: Array<{
    id: number;
    name: string;
    addedDate: string;
  }>;
};

export async function POST(request: Request) {
  try {
    const body: CreateSquadData = await request.json();
    console.log('Creating new squad:', body);

    // Create the squad in the database
    const newSquad = await prisma.squad.create({
      data: {
        name: body.name,
        goalkeeper: {
          create: {
            id: body.goalkeeper.id,
            name: body.goalkeeper.name,
            addedDate: body.goalkeeper.addedDate,
          },
        },
        teams: {
          create: body.teams.map((team) => ({
            id: team.id,
            name: team.name,
            addedDate: team.addedDate,
          })),
        },
        players: {
          create: body.players.map((player) => ({
            id: player.id,
            name: player.name,
            addedDate: player.addedDate,
          })),
        },
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
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 