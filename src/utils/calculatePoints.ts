import { Squad, SquadWithPoints } from '@/types/squad';

type Fixture = {
  id: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  event: number;
};

type PlayerStats = {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number; // 1 = goalkeeper, 2 = defender, 3 = midfielder, 4 = forward
  total_points: number;
  clean_sheets: number;
  goals_scored: number;
  assists: number;
};

type BootstrapData = {
  elements: PlayerStats[];
};

// Helper function to find player ID by name
function findPlayerIdByName(bootstrap: BootstrapData, playerName: string): number | null {
  const searchName = playerName.toLowerCase();
  
  // Debug logging for search
  console.log(`Searching for player: ${playerName}`);
  console.log(`Search name (lowercase): ${searchName}`);
  
  // First try exact match
  let player = bootstrap.elements.find((p: PlayerStats) => {
    const fullName = `${p.first_name} ${p.second_name}`.toLowerCase();
    const webName = p.web_name.toLowerCase();
    return fullName === searchName || webName === searchName;
  });

  // If no exact match, try partial match
  if (!player) {
    player = bootstrap.elements.find((p: PlayerStats) => {
      const fullName = `${p.first_name} ${p.second_name}`.toLowerCase();
      const webName = p.web_name.toLowerCase();
      return fullName.includes(searchName) || webName.includes(searchName);
    });
  }

  // Debug logging
  if (!player) {
    console.warn(`Player not found: ${playerName}`);
    console.log('Available players:', bootstrap.elements.map((p: PlayerStats) => ({
      id: p.id,
      fullName: `${p.first_name} ${p.second_name}`,
      webName: p.web_name,
      elementType: p.element_type
    })));
  } else {
    console.log(`Found player: ${player.first_name} ${player.second_name} (${player.web_name})`);
  }

  return player ? player.id : null;
}

export async function calculateSquadPoints(squad: Squad): Promise<SquadWithPoints> {
  // Fetch all necessary data
  const [bootstrap, fixtures] = await Promise.all([
    fetch("/api/fpl/bootstrap").then((res) => res.json()),
    fetch("/api/fpl/fixtures").then((res) => res.json()),
  ]);

  // Get team multipliers
  const getTeamMultiplier = (teamName: string) => {
    const lowerTeamName = teamName.toLowerCase();
    if (["arsenal", "liverpool", "manchester city"].includes(lowerTeamName)) {
      return 0.8;
    }
    if (["ipswich town", "leicester city", "southampton"].includes(lowerTeamName)) {
      return 1.25;
    }
    return 1;
  };

  // Calculate points for each component
  const points = {
    goalkeeper: 0,
    teams: {} as Record<number, number>,
    players: {} as Record<number, number>,
    total: 0,
  };

  // Calculate goalkeeper points (clean sheets)
  if (squad.goalkeeper.id !== 0) {
    const gkId = findPlayerIdByName(bootstrap, squad.goalkeeper.name);
    if (gkId) {
      const gkStats = bootstrap.elements.find(
        (p: PlayerStats) => p.id === gkId && p.element_type === 1
      );
      if (gkStats) {
        points.goalkeeper = gkStats.clean_sheets * 25;
      }
    }
  }

  // Calculate team points (wins = 10, draws = 4, goals = 2)
  squad.teams.forEach((team) => {
    if (team.id === 0) return;

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
    points.teams[team.id] = Math.round((wins * 10 + draws * 4 + goalsFor * 2) * multiplier);
  });

  // Calculate player points (goals = 12, assists = 12)
  squad.players.forEach((player) => {
    if (player.id === 0) return;

    const playerId = findPlayerIdByName(bootstrap, player.name);
    if (playerId) {
      const playerStats = bootstrap.elements.find(
        (p: PlayerStats) => p.id === playerId
      );
      if (playerStats) {
        points.players[player.id] =
          (playerStats.goals_scored + playerStats.assists) * 12;
      }
    } else {
      console.warn(`Player not found: ${player.name}`);
    }
  });

  // Calculate total points
  points.total =
    points.goalkeeper +
    Object.values(points.teams).reduce((sum, points) => sum + points, 0) +
    Object.values(points.players).reduce((sum, points) => sum + points, 0);

  return {
    ...squad,
    points,
  };
} 