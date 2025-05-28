type Team = {
  id: number;
  name: string;
};

type TeamStats = {
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  fantasyPoints: number;
  multiplier: number;
};

const TEAM_MULTIPLIERS: Record<string, number> = {
  'Arsenal': 0.8,
  'Liverpool': 0.8,
  'Man City': 0.8,
  'Ipswich': 1.25,
  'Leicester': 1.25,
  'Southampton': 1.25,
};

async function getTeamRecords(): Promise<TeamStats[]> {
  // Fetch teams and fixtures
  const [bootstrap, fixtures] = await Promise.all([
    fetch("https://fantasy.premierleague.com/api/bootstrap-static/").then(
      (res) => res.json()
    ),
    fetch("https://fantasy.premierleague.com/api/fixtures/").then((res) =>
      res.json()
    ),
  ]);

  const teams: Team[] = bootstrap.teams.map((t: { id: number; name: string }) => ({
    id: t.id,
    name: t.name,
  }));

  // Initialize stats
  const stats: Record<number, TeamStats> = {};
  teams.forEach((team) => {
    stats[team.id] = {
      name: team.name,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      fantasyPoints: 0,
      multiplier: TEAM_MULTIPLIERS[team.name] || 1,
    };
  });

  // Calculate stats from fixtures
  fixtures.forEach((fixture: { 
    finished: boolean; 
    team_h: number; 
    team_a: number; 
    team_h_score: number; 
    team_a_score: number; 
  }) => {
    if (!fixture.finished) return; // Only count finished matches

    const { team_h, team_a, team_h_score, team_a_score } = fixture;

    // Home team
    if (team_h_score > team_a_score) stats[team_h].wins += 1;
    else if (team_h_score < team_a_score) stats[team_h].losses += 1;
    else stats[team_h].draws += 1;

    stats[team_h].goalsFor += team_h_score;
    stats[team_h].goalsAgainst += team_a_score;
    if (team_a_score === 0) stats[team_h].cleanSheets += 1;

    // Away team
    if (team_a_score > team_h_score) stats[team_a].wins += 1;
    else if (team_a_score < team_h_score) stats[team_a].losses += 1;
    else stats[team_a].draws += 1;

    stats[team_a].goalsFor += team_a_score;
    stats[team_a].goalsAgainst += team_h_score;
    if (team_h_score === 0) stats[team_a].cleanSheets += 1;
  });

  return Object.values(stats)
    .map((team) => ({
      ...team,
      fantasyPoints: Math.round((team.wins * 10 + team.draws * 4 + team.goalsFor * 2) * team.multiplier),
    }))
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints);
}

export default async function TeamRecordsPage() {
  const records = await getTeamRecords();

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: 900,
        margin: "0 auto",
        background: "#fff",
        borderRadius: "1.5rem",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        minHeight: "80vh",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          marginBottom: "2rem",
          letterSpacing: "-1px",
          color: "#222",
          textAlign: "center",
        }}
      >
        Premier League Team Records
      </h1>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "1.1rem",
            background: "#fff",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <thead>
            <tr style={{ background: "#f6f6f6" }}>
              <th style={{ textAlign: "left", padding: "1rem" }}>Team</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>Multiplier</th>
              <th style={{ color: "#2563eb" }}>Fantasy Points</th>
            </tr>
          </thead>
          <tbody>
            {records.map((team, idx) => (
              <tr
                key={team.name}
                style={{
                  background: idx % 2 === 0 ? "#fafbfc" : "#fff",
                  fontWeight: idx === 0 ? 700 : 400,
                  color: idx === 0 ? "#2563eb" : "#222",
                  boxShadow:
                    idx === 0 ? "0 2px 12px rgba(37,99,235,0.08)" : undefined,
                }}
              >
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
                  {team.name}
                  {idx === 0 && (
                    <span
                      style={{
                        background: "#2563eb",
                        color: "#fff",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        padding: "0.2rem 0.7rem",
                        marginLeft: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                      }}
                    >
                      Leader
                    </span>
                  )}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.wins}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.draws}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.losses}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.goalsFor}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.goalsAgainst}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {team.multiplier}x
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #eee",
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                >
                  {team.fantasyPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
