import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { COUNTRIES, countryFlag } from "../shared/countries";

interface RankRow {
  player_id: string;
  username: string;
  wins: number;
  losses: number;
  country: string | null;
}

function countryName(code: string | null): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export default function RankingsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<RankRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("player_stats")
        .select("player_id, username, wins, losses, country, avg_rating")
        .order("wins", { ascending: false })
        .order("losses", { ascending: true })
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .order("player_id", { ascending: true });
      setRows((data as RankRow[]) ?? []);
    }
    load();
  }, []);

  return (
    <div>
      <h1>Rankings</h1>

      <div style={{ display: "flex", marginTop: 8, marginBottom: 16 }}>
        <span
          style={{
            background: "var(--accent)",
            color: "#fff",
            borderRadius: 20,
            padding: "8px 20px",
            fontWeight: 600,
          }}
        >
          🌐 Global
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ fontSize: 12, color: "var(--muted, #888)", textAlign: "left" }}>
            <th style={{ padding: "8px 4px", fontWeight: 400, width: 36 }}>RANK</th>
            <th style={{ padding: "8px 4px", fontWeight: 400 }}>PLAYER</th>
            <th style={{ padding: "8px 4px", fontWeight: 400, width: 52, textAlign: "right" }}>WINS</th>
            <th style={{ padding: "8px 4px", fontWeight: 400, width: 60, textAlign: "right" }}>LOSSES</th>
            <th style={{ padding: "8px 4px", fontWeight: 400, width: 52, textAlign: "right" }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isMe = r.player_id === session?.user.id;
            return (
              <tr
                key={r.player_id}
                style={{
                  borderTop: "1px solid var(--border)",
                  color: isMe ? "var(--accent)" : undefined,
                  outline: isMe ? "1px solid var(--accent)" : undefined,
                  borderRadius: isMe ? 8 : undefined,
                }}
              >
                <td style={{ padding: "10px 4px", verticalAlign: "middle" }}>{i + 1}</td>
                <td style={{ padding: "10px 4px", verticalAlign: "middle" }}>
                  {isMe ? (
                    <div style={{ fontWeight: 600 }}>You</div>
                  ) : (
                    <Link to={`/players/${r.player_id}`} style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}>
                      {r.username}
                    </Link>
                  )}
                  <div style={{ fontSize: 12, color: "var(--muted, #888)", whiteSpace: "nowrap" }}>
                    {countryFlag(r.country ?? "")} {countryName(r.country)}
                  </div>
                </td>
                <td style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle" }}>{r.wins}</td>
                <td style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle" }}>{r.losses}</td>
                <td style={{ padding: "10px 4px", textAlign: "right", verticalAlign: "middle" }}>{r.wins + r.losses}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && <p className="stat-secondary">No ranked players yet.</p>}
    </div>
  );
}
