import { EditSquadForm } from '@/components/EditSquadForm';
import { headers } from 'next/headers';

async function getSquadData(id: string) {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = `${protocol}://${host}/api/squads/${id}`;
  
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch squad: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching squad:', error);
    throw new Error(`Failed to fetch squad: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getFPLData() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = `${protocol}://${host}/api/fpl/bootstrap`;
  
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch FPL data: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('FPL data fetched for edit page:', {
      totalTeams: data.teams?.length,
      teamIdRange: data.teams ? `${Math.min(...data.teams.map((t: { id: number }) => t.id))}-${Math.max(...data.teams.map((t: { id: number }) => t.id))}` : 'N/A'
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching FPL data:', error);
    throw new Error(`Failed to fetch FPL data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default async function EditSquadPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [squadData, fplData] = await Promise.all([
      getSquadData(id),
      getFPLData()
    ]);

    return <EditSquadForm initialSquad={squadData} fplData={fplData} />;
  } catch (error) {
    console.error('Error in EditSquadPage:', error);
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700">
          {error instanceof Error ? error.message : 'An error occurred while loading the squad data.'}
        </p>
      </div>
    );
  }
} 