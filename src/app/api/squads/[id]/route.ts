import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type SquadTeam = {
  id: number;
  name: string;
  addedDate: string;
};

type SquadPlayer = {
  id: number;
  name: string;
  addedDate: string;
};

type SquadGoalkeeper = {
  id: number;
  name: string;
  addedDate: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    const squad = await prisma.squad.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        goalkeeper: true,
        teams: true,
        players: true,
      },
    });

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    return NextResponse.json(squad);
  } catch (error) {
    console.error('Error fetching squad:', error);
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    const body = await request.json();
    const { name, goalkeeper, teams, players }: {
      name: string;
      goalkeeper: SquadGoalkeeper;
      teams: SquadTeam[];
      players: SquadPlayer[];
    } = body;

    const squadId = parseInt(id);

    // Get the current squad data to compare for transfers
    const currentSquad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        goalkeeper: true,
        teams: true,
        players: true,
      },
    });

    if (!currentSquad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    const updatedSquad = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create transfer records for changes
      const transfers = [];

      // Check goalkeeper changes
      if (currentSquad.goalkeeper && currentSquad.goalkeeper.id !== goalkeeper.id) {
        // Goalkeeper removed
        transfers.push({
          squadId,
          squadName: name,
          type: 'goalkeeper',
          playerId: currentSquad.goalkeeper.id,
          playerName: currentSquad.goalkeeper.name,
          action: 'removed',
        });
      }
      if (goalkeeper.id && (!currentSquad.goalkeeper || currentSquad.goalkeeper.id !== goalkeeper.id)) {
        // Goalkeeper added
        transfers.push({
          squadId,
          squadName: name,
          type: 'goalkeeper',
          playerId: goalkeeper.id,
          playerName: goalkeeper.name,
          action: 'added',
        });
      }

      // Check team changes
      const currentTeamIds = new Set(currentSquad.teams.map(t => t.id));
      const newTeamIds = new Set(teams.map(t => t.id));

      // Removed teams
      currentSquad.teams.forEach(team => {
        if (!newTeamIds.has(team.id)) {
          transfers.push({
            squadId,
            squadName: name,
            type: 'team',
            playerId: team.id,
            playerName: team.name,
            action: 'removed',
          });
        }
      });

      // Added teams
      teams.forEach(team => {
        if (!currentTeamIds.has(team.id)) {
          transfers.push({
            squadId,
            squadName: name,
            type: 'team',
            playerId: team.id,
            playerName: team.name,
            action: 'added',
          });
        }
      });

      // Check player changes
      const currentPlayerIds = new Set(currentSquad.players.map(p => p.id));
      const newPlayerIds = new Set(players.map(p => p.id));

      // Removed players
      currentSquad.players.forEach(player => {
        if (!newPlayerIds.has(player.id)) {
          transfers.push({
            squadId,
            squadName: name,
            type: 'player',
            playerId: player.id,
            playerName: player.name,
            action: 'removed',
          });
        }
      });

      // Added players
      players.forEach(player => {
        if (!currentPlayerIds.has(player.id)) {
          transfers.push({
            squadId,
            squadName: name,
            type: 'player',
            playerId: player.id,
            playerName: player.name,
            action: 'added',
          });
        }
      });

      // Create transfer records
      if (transfers.length > 0) {
        await tx.transfer.createMany({
          data: transfers,
        });
      }

      // Delete existing relationships
      await tx.goalkeeper.deleteMany({
        where: { squadId }
      });
      await tx.team.deleteMany({
        where: { squadId }
      });
      await tx.player.deleteMany({
        where: { squadId }
      });

      // Update squad and create new relationships
      return await tx.squad.update({
        where: { id: squadId },
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
            create: teams.map((team: SquadTeam) => ({
              id: team.id,
              name: team.name,
              addedDate: new Date(team.addedDate)
            }))
          },
          players: {
            create: players.map((player: SquadPlayer) => ({
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
    });

    return NextResponse.json(updatedSquad);
  } catch (error) {
    console.error('Error updating squad:', error);
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if we're in a build environment without database access
    if (!process.env.DATABASE_URL || !prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    
    await prisma.squad.delete({
      where: {
        id: parseInt(id)
      },
    });

    return NextResponse.json({ message: 'Squad deleted successfully' });
  } catch (error) {
    console.error('Error deleting squad:', error);
    // If it's a database connection error, return 503
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 