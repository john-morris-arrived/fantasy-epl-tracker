import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: {
        'User-Agent': 'Fantasy EPL Tracker',
      },
    });

    if (!response.ok) {
      throw new Error(`FPL API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return only the data we need to reduce payload size
    return NextResponse.json({
      elements: data.elements,
      teams: data.teams
    });
  } catch (error) {
    console.error('Error fetching FPL data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FPL data' },
      { status: 500 }
    );
  }
} 