'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApiPlayer = {
  id: number;
  web_name: string;
  element_type: number; // 1 = GK, 2 = DEF, 3 = MID, 4 = FWD
  first_name: string;
  second_name: string;
};

type ApiTeam = {
  id: number;
  name: string;
  short_name: string;
};

export function CreateSquadForm() {
  const router = useRouter();
  const [squadName, setSquadName] = useState('');
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState<ApiPlayer | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<ApiTeam[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<ApiPlayer[]>([]);
  const [fplData, setFplData] = useState<{ elements: ApiPlayer[]; teams: ApiTeam[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFPLData() {
      try {
        const response = await fetch('/api/fpl/bootstrap');
        
        if (!response.ok) {
          throw new Error('Failed to fetch FPL data');
        }
        
        const data = await response.json();
        setFplData({
          elements: data.elements,
          teams: data.teams
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchFPLData();
  }, []);

  const handleSave = async () => {
    if (!squadName.trim()) {
      alert('Please enter a squad name');
      return;
    }

    if (!selectedGoalkeeper) {
      alert('Please select a goalkeeper');
      return;
    }

    if (selectedTeams.length !== 2) {
      alert('Please select exactly 2 teams');
      return;
    }

    if (selectedPlayers.length !== 3) {
      alert('Please select exactly 3 players');
      return;
    }

    const newSquad = {
      name: squadName,
      goalkeeper: {
        id: selectedGoalkeeper.id,
        name: `${selectedGoalkeeper.first_name} ${selectedGoalkeeper.second_name}`,
        addedDate: new Date().toISOString()
      },
      teams: selectedTeams.map(team => ({
        id: team.id,
        name: team.name,
        addedDate: new Date().toISOString()
      })),
      players: selectedPlayers.map(player => ({
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        addedDate: new Date().toISOString()
      }))
    };

    console.log('Creating new squad:', newSquad);

    try {
      const response = await fetch('/api/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSquad),
      });

      if (response.ok) {
        router.push('/squads');
      } else {
        const errorText = await response.text();
        console.error('Failed to create squad:', response.status, response.statusText, errorText);
        alert('Failed to create squad. Please try again.');
      }
    } catch (error) {
      console.error('Error creating squad:', error);
      alert('Error creating squad. Please try again.');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Squad</h1>
      
      {loading && (
        <div className="text-center py-8">
          <p>Loading FPL data...</p>
        </div>
      )}
      
      {error && (
        <div className="text-center py-8 text-red-600">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && fplData && (
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="squad-name">Squad Name</Label>
            <Input
              id="squad-name"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              placeholder="Enter squad name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goalkeeper">Goalkeeper</Label>
            <Select
              value={selectedGoalkeeper?.id.toString() || ''}
              onValueChange={(value: string) => {
                const gk = fplData?.elements.find(p => p.id.toString() === value);
                setSelectedGoalkeeper(gk || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goalkeeper" />
              </SelectTrigger>
              <SelectContent>
                {fplData?.elements
                  .filter(p => p.element_type === 1)
                  .sort((a, b) => a.second_name.localeCompare(b.second_name))
                  .map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {`${player.first_name} ${player.second_name}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Teams (Select 2)</Label>
            <Select
              value={selectedTeams[0]?.id.toString() || ''}
              onValueChange={(value: string) => {
                const team = fplData?.teams.find(t => t.id.toString() === value);
                if (team) {
                  setSelectedTeams([team, ...selectedTeams.slice(1)]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select first team" />
              </SelectTrigger>
              <SelectContent>
                {fplData?.teams
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTeams[1]?.id.toString() || ''}
              onValueChange={(value: string) => {
                const team = fplData?.teams.find(t => t.id.toString() === value);
                if (team) {
                  setSelectedTeams([selectedTeams[0], team]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select second team" />
              </SelectTrigger>
              <SelectContent>
                {fplData?.teams
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Players (Select 3)</Label>
            {[0, 1, 2].map((index) => (
              <Select
                key={index}
                value={selectedPlayers[index]?.id.toString() || ''}
                onValueChange={(value: string) => {
                  const player = fplData?.elements.find(p => p.id.toString() === value);
                  if (player) {
                    const newPlayers = [...selectedPlayers];
                    newPlayers[index] = player;
                    setSelectedPlayers(newPlayers);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select player ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {fplData?.elements
                    .filter(p => p.element_type !== 1) // Exclude goalkeepers
                    .sort((a, b) => a.second_name.localeCompare(b.second_name))
                    .map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {`${player.first_name} ${player.second_name}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.push('/squads')}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Create Squad
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 