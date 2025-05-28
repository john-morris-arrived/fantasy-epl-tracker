'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Squad } from '@/types/squad';
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

type EditSquadFormProps = {
  initialSquad: Squad;
  fplData: {
    elements: ApiPlayer[];
    teams: ApiTeam[];
  };
};

export function EditSquadForm({ initialSquad, fplData }: EditSquadFormProps) {
  const router = useRouter();
  const [squadName, setSquadName] = useState(initialSquad.name);
  
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState<ApiPlayer | null>(() => {
    const found = fplData.elements.find((p: ApiPlayer) => p.id === initialSquad.goalkeeper.id);
    if (!found) {
      console.warn(`Goalkeeper with ID ${initialSquad.goalkeeper.id} not found in FPL data`);
    }
    return found || null;
  });
  
  const [selectedTeams, setSelectedTeams] = useState<ApiTeam[]>(() => {
    return initialSquad.teams.map((t: SquadTeam) => {
      const team = fplData.teams.find((team: ApiTeam) => team.id === t.id);
      if (!team) {
        console.warn(`Team with ID ${t.id} not found in FPL data. Available team IDs: ${fplData.teams.map(team => team.id).join(', ')}`);
        return null;
      }
      return team;
    }).filter((team): team is ApiTeam => team !== null);
  });
  
  const [selectedPlayers, setSelectedPlayers] = useState<ApiPlayer[]>(() => {
    return initialSquad.players.map((p: SquadPlayer) => {
      const player = fplData.elements.find((player: ApiPlayer) => player.id === p.id);
      if (!player) {
        console.warn(`Player with ID ${p.id} not found in FPL data`);
        return null;
      }
      return player;
    }).filter((player): player is ApiPlayer => player !== null);
  });

  const handleSave = async () => {
    const updatedSquad: Squad = {
      ...initialSquad,
      name: squadName,
      goalkeeper: selectedGoalkeeper ? {
        id: selectedGoalkeeper.id,
        name: `${selectedGoalkeeper.first_name} ${selectedGoalkeeper.second_name}`,
        addedDate: new Date().toISOString()
      } : {
        id: 0,
        name: '',
        addedDate: ''
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

    console.log('Sending squad update:', updatedSquad);

    try {
      const response = await fetch(`/api/squads/${initialSquad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSquad),
      });

      if (response.ok) {
        router.push('/squads');
      } else {
        const errorText = await response.text();
        console.error('Failed to update squad:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error updating squad:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Squad</h1>
      
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
            value={selectedGoalkeeper?.id.toString()}
            onValueChange={(value: string) => {
              const gk = fplData.elements.find(p => p.id.toString() === value);
              setSelectedGoalkeeper(gk || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select goalkeeper" />
            </SelectTrigger>
            <SelectContent>
              {fplData.elements
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
            value={selectedTeams[0]?.id.toString()}
            onValueChange={(value: string) => {
              const team = fplData.teams.find(t => t.id.toString() === value);
              if (team) {
                setSelectedTeams([team, ...selectedTeams.slice(1)]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select first team" />
            </SelectTrigger>
            <SelectContent>
              {fplData.teams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedTeams[1]?.id.toString()}
            onValueChange={(value: string) => {
              const team = fplData.teams.find(t => t.id.toString() === value);
              if (team) {
                setSelectedTeams([selectedTeams[0], team]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select second team" />
            </SelectTrigger>
            <SelectContent>
              {fplData.teams
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
              value={selectedPlayers[index]?.id.toString()}
              onValueChange={(value: string) => {
                const player = fplData.elements.find(p => p.id.toString() === value);
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
                {fplData.elements
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
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
} 