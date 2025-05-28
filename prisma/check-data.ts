import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const squads = await prisma.squad.findMany({
      include: {
        goalkeeper: true,
        teams: true,
        players: true,
      },
    });
    console.log('Found squads:', squads.length);
    console.log(JSON.stringify(squads, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 