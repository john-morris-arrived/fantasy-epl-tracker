import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/fixtures/');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch FPL fixtures data:', error);
    return NextResponse.json({ error: 'Failed to fetch FPL data' }, { status: 500 });
  }
} 