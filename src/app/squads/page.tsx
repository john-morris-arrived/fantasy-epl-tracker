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
        const [squadsResponse, fplResponse] = await Promise.all([
          fetch('/api/squads'),
          fetch('/api/fpl/bootstrap')
        ]);
        
        if (!squadsResponse.ok) {
          throw new Error(`HTTP error! status: ${squadsResponse.status}`);
        }
        if (!fplResponse.ok) {
          throw new Error(`HTTP error! status: ${fplResponse.status}`);
        }
        
        const squadsData = await squadsResponse.json();
        const fplData = await fplResponse.json();
        
        console.log('Received squads:', squadsData);
        setSquads(squadsData);
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
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Squads</h1>
        <div className="text-center text-gray-500">Loading squads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Squads</h1>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!squads.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Squads</h1>
          <Link href="/squads/create">
            <Button>Add Squad</Button>
          </Link>
        </div>
        <div className="text-center text-gray-500">No squads found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Squads</h1>
        <Link href="/squads/create">
          <Button>Add Squad</Button>
        </Link>
      </div>
      
      <div className="grid gap-6">
        {squads.map((squad) => (
          <Card key={squad.id}>
            <CardHeader>
              <CardTitle>{squad.name}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 