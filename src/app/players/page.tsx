type Player = {
  id: number;
  web_name: string;
  goals_scored: number;
  assists: number;
  total_points: number;
};

type ApiPlayer = {
  id: number;
  web_name: string;
  goals_scored: number;
  assists: number;
};

type ApiResponse = {
  elements: ApiPlayer[];
};

async function getPlayerStats(): Promise<Player[]> {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    {
      // cache: "no-store", // Uncomment for always-fresh data
    }
  );
  const data: ApiResponse = await res.json();
  
  return data.elements
    .filter((player) => player.goals_scored > 0 || player.assists > 0)
    .map((player) => ({
      id: player.id,
      web_name: player.web_name,
      goals_scored: player.goals_scored,
      assists: player.assists,
      total_points: (player.goals_scored + player.assists) * 12
    }))
    .sort((a, b) => b.total_points - a.total_points);
}

export default async function PlayerStats() {
  const players = await getPlayerStats();

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
        Premier League Player Stats
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
              <th style={{ textAlign: "left", padding: "1rem" }}>Player</th>
              <th>Goals</th>
              <th>Assists</th>
              <th style={{ color: "#2563eb" }}>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id}
                style={{
                  background: idx % 2 === 0 ? "#fafbfc" : "#fff",
                  fontWeight: idx === 0 ? 700 : 400,
                  color: idx === 0 ? "#2563eb" : "#222",
                  boxShadow:
                    idx === 0 ? "0 2px 12px rgba(37,99,235,0.08)" : undefined,
                }}
              >
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
                  {player.web_name}
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
                  {player.goals_scored}
                </td>
                <td align="center" style={{ borderBottom: "1px solid #eee" }}>
                  {player.assists}
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #eee",
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                >
                  {player.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
