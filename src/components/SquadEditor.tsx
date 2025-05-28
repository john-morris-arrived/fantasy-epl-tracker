'use client';

import { useState, useEffect } from 'react';
import { Squad } from '@/types/squad';
import { Label } from "@/components/ui/label";

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

type SquadEditorProps = {
  squad: Squad;
};

export function SquadEditor({ squad }: SquadEditorProps) {
  const [loading, setLoading] = useState(true);
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState<ApiPlayer | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<ApiTeam[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<ApiPlayer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fpl/bootstrap');
        const data = await response.json();
        
        // Get all players and teams
        const allPlayers = data.elements;
        const allTeams = data.teams;
        
        // Debug logging for API response
        console.log('Raw API Response:', data);
        console.log('All Players:', allPlayers);
        
        // Find the goalkeeper by name
        const gk = allPlayers.find((p: ApiPlayer) => 
          `${p.first_name} ${p.second_name}` === squad.goalkeeper.name
        );
        if (gk) setSelectedGoalkeeper(gk);
        
        // Find teams by name
        const selectedTeams = squad.teams.map(t => {
          const searchName = t.name.toLowerCase();
          const team = allTeams.find((team: ApiTeam) => {
            const teamName = team.name.toLowerCase();
            const shortName = team.short_name.toLowerCase();
            
            // Common team name variations
            const variations: Record<string, string[]> = {
              'manchester city': ['man city', 'mancity', 'manchester'],
              'manchester united': ['man united', 'manutd', 'manchester'],
              'tottenham hotspur': ['tottenham', 'spurs'],
              'newcastle united': ['newcastle'],
              'brighton and hove albion': ['brighton'],
              'crystal palace': ['palace'],
              'west ham united': ['west ham'],
              'nottingham forest': ['forest'],
              'leeds united': ['leeds'],
              'leicester city': ['leicester'],
              'wolverhampton wanderers': ['wolves', 'wolverhampton'],
              'aston villa': ['villa'],
              'everton': ['everton'],
              'fulham': ['fulham'],
              'bournemouth': ['bournemouth'],
              'brentford': ['brentford'],
              'burnley': ['burnley'],
              'luton town': ['luton'],
              'sheffield united': ['sheffield'],
              'ipswich town': ['ipswich']
            };
            
            // Check exact matches
            if (teamName === searchName || shortName === searchName) return true;
            
            // Check variations
            for (const [fullName, vars] of Object.entries(variations)) {
              if (searchName === fullName && vars.some(v => teamName === v || shortName === v)) return true;
              if (vars.includes(searchName) && teamName === fullName) return true;
            }
            
            // Check partial matches as fallback
            return teamName.includes(searchName) || shortName.includes(searchName);
          });
          
          if (!team) {
            console.error(`Team not found: ${t.name}`);
            console.log('Available teams:', allTeams.map((t: ApiTeam) => ({
              id: t.id,
              name: t.name,
              shortName: t.short_name
            })));
            return null;
          }
          return team;
        }).filter((team): team is ApiTeam => team !== null);
        
        setSelectedTeams(selectedTeams);
        
        // Find players by name
        const selectedPlayers = squad.players.map(p => {
          const searchName = p.name.toLowerCase();
          console.log(`Searching for player: ${p.name}`);
          console.log(`Search name (lowercase): ${searchName}`);
          
          const player = allPlayers.find((player: ApiPlayer) => {
            const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
            const webName = player.web_name.toLowerCase();
            
            console.log(`Checking player: ${player.first_name} ${player.second_name} (${player.web_name})`);
            
            // Common player name variations
            const variations: Record<string, string[]> = {
              'bruno fernandes': ['bruno', 'fernandes', 'b.fernandes', 'b fernandes'],
              'kevin de bruyne': ['kdb', 'de bruyne', 'k.de bruyne', 'k de bruyne'],
              'son heung-min': ['son', 'heung-min', 'heung min', 's.heung-min', 's heung-min'],
              'gabriel martinelli': ['martinelli', 'g.martinelli', 'g martinelli'],
              'bukayo saka': ['saka', 'b.saka', 'b saka'],
              'cole palmer': ['palmer', 'c.palmer', 'c palmer'],
              'jarrod bowen': ['bowen', 'j.bowen', 'j bowen'],
              'ollie watkins': ['watkins', 'o.watkins', 'o watkins'],
              'dominic solanke': ['solanke', 'd.solanke', 'd solanke'],
              'phil foden': ['foden', 'p.foden', 'p foden'],
              'alexander isak': ['isak', 'a.isak', 'a isak'],
              'richarlison': ['richarlison'],
              'rodri': ['rodri'],
              'bernardo silva': ['bernardo', 'silva', 'b.silva', 'b silva'],
              'erling haaland': ['haaland', 'e.haaland', 'e haaland'],
              'mohamed salah': ['salah', 'm.salah', 'm salah'],
              'alisson': ['alisson'],
              'ederson': ['ederson'],
              'david raya': ['raya', 'd.raya', 'd raya'],
              'emiliano martínez': ['martinez', 'emiliano', 'e.martinez', 'e martinez'],
              'nick pope': ['pope', 'n.pope', 'n pope'],
              'jordan pickford': ['pickford', 'j.pickford', 'j pickford'],
              'diogo jota': ['jota', 'd.jota', 'd jota', 'diogo j.', 'diogo j'],
              'gabriel jesus': ['jesus', 'g.jesus', 'g jesus']
            };
            
            // Check exact matches
            if (fullName === searchName || webName === searchName) {
              console.log('Found exact match');
              return true;
            }
            
            // Check variations
            for (const [fullName, vars] of Object.entries(variations)) {
              if (searchName === fullName && vars.some(v => webName === v)) {
                console.log('Found variation match');
                return true;
              }
              if (vars.includes(searchName) && fullName === searchName) {
                console.log('Found variation match');
                return true;
              }
            }
            
            // Check partial matches as fallback
            const partialMatch = fullName.includes(searchName) || webName.includes(searchName);
            if (partialMatch) {
              console.log('Found partial match');
            }
            return partialMatch;
          });
          
          if (!player) {
            console.error(`Player not found: ${p.name}`);
            console.log('Available players:', allPlayers.map((p: ApiPlayer) => ({
              id: p.id,
              fullName: `${p.first_name} ${p.second_name}`,
              webName: p.web_name,
              elementType: p.element_type
            })));
            return null;
          }
          return player;
        }).filter((player): player is ApiPlayer => player !== null);
        
        setSelectedPlayers(selectedPlayers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [squad]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Squad Name</Label>
        <div className="text-sm">{squad.name}</div>
      </div>

      <div className="grid gap-2">
        <Label>Goalkeeper</Label>
        <div className="text-sm">
          {selectedGoalkeeper ? `${selectedGoalkeeper.first_name} ${selectedGoalkeeper.second_name}` : 'No goalkeeper selected'}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Teams</Label>
        <div className="text-sm">
          {selectedTeams.map(team => team.name).join(', ')}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Players</Label>
        <div className="text-sm">
          {selectedPlayers.map(player => `${player.first_name} ${player.second_name}`).join(', ')}
        </div>
      </div>
    </div>
  );
} 