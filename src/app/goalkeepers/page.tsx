type Goalkeeper = {
  id: number;
  web_name: string;
  clean_sheets: number;
  total_points: number;
};

type ApiPlayer = {
  id: number;
  web_name: string;
  clean_sheets: number;
  element_type: number; // 1 is goalkeeper
};

type ApiResponse = {
  elements: ApiPlayer[];
};

async function getGoalkeeperStats(): Promise<Goalkeeper[]> {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    {
      // cache: "no-store", // Uncomment for always-fresh data
    }
  );
  const data: ApiResponse = await res.json();
  
  return data.elements
    .filter((player) => player.element_type === 1 && player.clean_sheets > 0)
    .map((player) => ({
      id: player.id,
      web_name: player.web_name,
      clean_sheets: player.clean_sheets,
      total_points: player.clean_sheets * 25
    }))
    .sort((a, b) => b.total_points - a.total_points);
}

export default async function GoalkeeperStats() {
  const goalkeepers = await getGoalkeeperStats();

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
        Premier League Goalkeeper Stats
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
              <th style={{ textAlign: "left", padding: "1rem" }}>Goalkeeper</th>
              <th>Clean Sheets</th>
              <th style={{ color: "#2563eb" }}>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {goalkeepers.map((gk, idx) => (
              <tr
                key={gk.id}
                style={{
                  background: idx % 2 === 0 ? "#fafbfc" : "#fff",
                  fontWeight: idx === 0 ? 700 : 400,
                  color: idx === 0 ? "#2563eb" : "#222",
                  boxShadow:
                    idx === 0 ? "0 2px 12px rgba(37,99,235,0.08)" : undefined,
                }}
              >
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
                  {gk.web_name}
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
                  {gk.clean_sheets}
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #eee",
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                >
                  {gk.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
} 