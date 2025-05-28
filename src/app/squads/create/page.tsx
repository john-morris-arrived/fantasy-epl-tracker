'use client';

import { CreateSquadForm } from '@/components/CreateSquadForm';

async function getFPLData() {
  const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch FPL data');
  }
  
  return response.json();
}

export default async function CreateSquadPage() {
  const fplData = await getFPLData();

  return (
    <CreateSquadForm 
      fplData={{
        elements: fplData.elements,
        teams: fplData.teams
      }}
    />
  );
} 