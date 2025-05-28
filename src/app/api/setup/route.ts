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

    console.log('Checking if tables exist...');
    
    // Check if tables already exist by trying to query one
    try {
      await prisma.squad.findFirst();
      console.log('Tables already exist');
      return NextResponse.json({ message: 'Database already set up' });
    } catch {
      console.log('Tables do not exist, need to create them');
    }

    // Since we can't create tables with raw SQL due to permissions,
    // let's try to use Prisma's introspection and push
    try {
      // This is a workaround - we'll return instructions for manual setup
      return NextResponse.json({ 
        error: 'Database schema needs to be created',
        message: 'Please run "npx prisma db push" locally with the production DATABASE_URL to create the schema',
        instructions: [
          '1. Run: vercel env pull .env.production',
          '2. Run: DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d= -f2-) npx prisma db push',
          '3. Or contact support to grant schema creation permissions'
        ]
      }, { status: 400 });
    } catch (error) {
      console.error('Error in setup process:', error);
      return NextResponse.json({ 
        error: 'Setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 