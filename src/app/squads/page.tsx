'use client';

import { useEffect, useState } from 'react';
import { Squad } from '@/types/squad';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

type ApiPlayer = {
  id: number;
  web_name: string;
  element_type: number;
  first_name: string;
  second_name: string;
};

type ApiTeam = {
  id: number;
  name: string;
  short_name: string;
};

type FPLData = {
  elements: ApiPlayer[];
  teams: ApiTeam[];
};

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [fplData, setFplData] = useState<FPLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch squads first, then FPL data to avoid overwhelming the APIs
        console.log('Fetching squads...');
        const squadsResponse = await fetch('/api/squads');
        
        if (!squadsResponse.ok) {
          const errorText = await squadsResponse.text();
          throw new Error(`Failed to fetch squads: ${squadsResponse.status} - ${errorText}`);
        }
        
        const squadsData = await squadsResponse.json();
        console.log('Squads fetched successfully:', squadsData.length);
        setSquads(squadsData);
        
        // Fetch FPL data separately with retry logic
        console.log('Fetching FPL data...');
        let fplData = null;
        let retries = 3;
        
        while (retries > 0) {
          try {
            const fplResponse = await fetch('/api/fpl/bootstrap');
            if (fplResponse.ok) {
              fplData = await fplResponse.json();
              console.log('FPL data fetched successfully');
              break;
            } else {
              throw new Error(`FPL API error: ${fplResponse.status}`);
            }
          } catch (fplError) {
            retries--;
            console.warn(`FPL fetch failed, retries left: ${retries}`, fplError);
            if (retries === 0) {
              console.error('FPL data fetch failed after all retries, continuing without it');
              // Don't throw error, just continue without FPL data
            } else {
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        setFplData(fplData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPlayerName = (playerId: number): string => {
    if (!fplData) return 'Loading...';
    const player = fplData.elements.find(p => p.id === playerId);
    return player ? `${player.first_name} ${player.second_name}` : 'Unknown Player';
  };

  const getTeamName = (teamId: number): string => {
    if (!fplData) return 'Loading...';
    const team = fplData.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Squads</h1>
        <div className="text-center text-gray-500">Loading squads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Squads</h1>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!squads.length) {
    return (
      <div className="container mx-auto py-4 px-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold">Squads</h1>
          <Link href="/squads/create">
            <Button className="w-full sm:w-auto">Add Squad</Button>
          </Link>
        </div>
        <div className="text-center text-gray-500">No squads found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 md:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Squads</h1>
        <Link href="/squads/create">
          <Button className="w-full sm:w-auto">Add Squad</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:gap-6">
        {squads.map((squad) => (
          <Card key={squad.id}>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">{squad.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm text-gray-600 mb-1">Goalkeeper</div>
                    <div className="text-sm">
                      {squad.goalkeeper?.id ? getPlayerName(squad.goalkeeper.id) : 'No goalkeeper'}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm text-gray-600 mb-1">Teams</div>
                    <div className="text-sm">
                      {squad.teams?.length ? 
                        squad.teams.map(team => getTeamName(team.id)).join(', ') : 
                        'No teams'
                      }
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm text-gray-600 mb-1">Players</div>
                    <div className="text-sm">
                      {squad.players?.length ? 
                        squad.players.map(player => getPlayerName(player.id)).join(', ') : 
                        'No players'
                      }
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <Link href={`/squads/edit/${squad.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Edit Squad
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goalkeeper</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {squad.goalkeeper?.id ? getPlayerName(squad.goalkeeper.id) : 'No goalkeeper'}
                      </TableCell>
                      <TableCell>
                        {squad.teams?.length ? 
                          squad.teams.map(team => getTeamName(team.id)).join(', ') : 
                          'No teams'
                        }
                      </TableCell>
                      <TableCell>
                        {squad.players?.length ? 
                          squad.players.map(player => getPlayerName(player.id)).join(', ') : 
                          'No players'
                        }
                      </TableCell>
                      <TableCell>
                        <Link href={`/squads/edit/${squad.id}`}>
                          <Button variant="outline" size="sm">
                            Edit Squad
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 