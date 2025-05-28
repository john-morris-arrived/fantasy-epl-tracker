'use client';

import { useEffect, useState, useCallback } from 'react';
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

type ApiPlayer = {
  id: number;
  web_name: string;
  element_type: number;
  first_name: string;
  second_name: string;
  total_points: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
};

type ApiTeam = {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  pulse_id: number;
};

type Fixture = {
  id: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  event: number;
};

type FPLData = {
  elements: ApiPlayer[];
  teams: ApiTeam[];
};

type SquadScore = {
  squad: Squad;
  goalkeeperScore: number;
  teamScores: number[];
  playerScores: number[];
  totalScore: number;
};

export default function SquadScoringPage() {
  const [fplData, setFplData] = useState<FPLData | null>(null);
  const [squadScores, setSquadScores] = useState<SquadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get team multiplier (same as calculatePoints.ts)
  const getTeamMultiplier = (teamName: string) => {
    const lowerTeamName = teamName.toLowerCase();
    if (["arsenal", "liverpool", "manchester city", "man city"].includes(lowerTeamName)) {
      return 0.8;
    }
    if (["ipswich town", "ipswich", "leicester city", "leicester", "southampton"].includes(lowerTeamName)) {
      return 1.25;
    }
    return 1;
  };

  const calculateSquadScores = useCallback((squads: Squad[], fplData: FPLData, fixtures: Fixture[]): SquadScore[] => {
    return squads.map(squad => {
      // Calculate goalkeeper points (clean sheets * 25)
      const goalkeeper = fplData.elements.find(p => p.id === squad.goalkeeper.id && p.element_type === 1);
      const goalkeeperScore = goalkeeper ? goalkeeper.clean_sheets * 25 : 0;

      // Calculate team scores (wins = 10, draws = 4, goals = 2, with multipliers)
      const teamScores = squad.teams.map(team => {
        const teamFixtures = fixtures.filter(
          (f: Fixture) =>
            (f.team_h === team.id || f.team_a === team.id) && f.finished
        );

        let wins = 0;
        let draws = 0;
        let goalsFor = 0;

        teamFixtures.forEach((fixture: Fixture) => {
          if (fixture.team_h_score === null || fixture.team_a_score === null) return;

          if (fixture.team_h === team.id) {
            if (fixture.team_h_score > fixture.team_a_score) wins += 1;
            else if (fixture.team_h_score === fixture.team_a_score) draws += 1;
            goalsFor += fixture.team_h_score;
          } else {
            if (fixture.team_a_score > fixture.team_h_score) wins += 1;
            else if (fixture.team_a_score === fixture.team_h_score) draws += 1;
            goalsFor += fixture.team_a_score;
          }
        });

        // Apply team multiplier
        const multiplier = getTeamMultiplier(team.name);
        return Math.round((wins * 10 + draws * 4 + goalsFor * 2) * multiplier);
      });

      // Calculate player scores (goals + assists) * 12
      const playerScores = squad.players.map(player => {
        const playerData = fplData.elements.find(p => p.id === player.id);
        return playerData ? (playerData.goals_scored + playerData.assists) * 12 : 0;
      });

      // Calculate total score
      const totalScore = goalkeeperScore + 
                        teamScores.reduce((sum, score) => sum + score, 0) + 
                        playerScores.reduce((sum, score) => sum + score, 0);

      return {
        squad,
        goalkeeperScore,
        teamScores,
        playerScores,
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore); // Sort by total score descending
  }, [getTeamMultiplier]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [squadsResponse, fplResponse, fixturesResponse] = await Promise.all([
          fetch('/api/squads'),
          fetch('/api/fpl/bootstrap'),
          fetch('/api/fpl/fixtures')
        ]);
        
        if (!squadsResponse.ok) {
          throw new Error(`HTTP error! status: ${squadsResponse.status}`);
        }
        if (!fplResponse.ok) {
          throw new Error(`HTTP error! status: ${fplResponse.status}`);
        }
        if (!fixturesResponse.ok) {
          throw new Error(`HTTP error! status: ${fixturesResponse.status}`);
        }
        
        const squadsData = await squadsResponse.json();
        const fplData = await fplResponse.json();
        const fixturesData = await fixturesResponse.json();
        
        setFplData(fplData);
        
        // Calculate scores for each squad
        const scores = calculateSquadScores(squadsData, fplData, fixturesData);
        setSquadScores(scores);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [calculateSquadScores]);

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
        <h1 className="text-2xl font-bold mb-6">Squad Scoring</h1>
        <div className="text-center text-gray-500">Loading squad scores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Squad Scoring</h1>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!squadScores.length) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Squad Scoring</h1>
        <div className="text-center text-gray-500">No squads found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Squad Scoring</h1>
      <div className="mb-4 text-sm text-gray-600">
        <p><strong>Scoring System:</strong></p>
        <p>• Goalkeepers: Clean sheets × 25 points</p>
        <p>• Teams: Wins × 10 + Draws × 4 + Goals × 2 (with difficulty multipliers)</p>
        <p>• Players: (Goals + Assists) × 12 points</p>
      </div>
      
      <div className="grid gap-6">
        {squadScores.map((squadScore, index) => (
          <Card key={squadScore.squad.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>#{index + 1} {squadScore.squad.name}</span>
                <span className="text-2xl font-bold text-green-600">
                  {squadScore.totalScore} pts
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Player/Team</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Goalkeeper</TableCell>
                    <TableCell>
                      {squadScore.squad.goalkeeper?.id ? 
                        getPlayerName(squadScore.squad.goalkeeper.id) : 
                        'No goalkeeper'
                      }
                    </TableCell>
                    <TableCell className="font-bold">
                      {squadScore.goalkeeperScore}
                    </TableCell>
                  </TableRow>
                  {squadScore.squad.teams.map((team, teamIndex) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        Team {teamIndex + 1}
                      </TableCell>
                      <TableCell>{getTeamName(team.id)}</TableCell>
                      <TableCell className="font-bold">
                        {squadScore.teamScores[teamIndex] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  {squadScore.squad.players.map((player, playerIndex) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        Player {playerIndex + 1}
                      </TableCell>
                      <TableCell>{getPlayerName(player.id)}</TableCell>
                      <TableCell className="font-bold">
                        {squadScore.playerScores[playerIndex] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-lg text-green-600">
                      {squadScore.totalScore}
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