import { useEffect, useState } from "react";
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
        .select("player_id, username, wins, losses, country")
        .order("wins", { ascending: false })
        .order("losses", { ascending: true });
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

      <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 60px 90px", gap: 8, padding: "8px 0", fontSize: 13, color: "var(--muted, #888)", borderBottom: "1px solid var(--border)" }}>
        <div>RANK</div>
        <div>PLAYER</div>
        <div>WINS</div>
        <div>LOSSES</div>
        <div>TOTAL</div>
      </div>

      {rows.map((r, i) => {
        const isMe = r.player_id === session?.user.id;
        return (
          <div
            key={r.player_id}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 60px 60px 90px",
              gap: 8,
              alignItems: "center",
              padding: "12px 4px",
              borderBottom: "1px solid var(--border)",
              border: isMe ? "1px solid var(--accent)" : undefined,
              borderRadius: isMe ? 8 : 0,
              color: isMe ? "var(--accent)" : undefined,
            }}
          >
            <div>{i + 1}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{isMe ? "You" : r.username}</div>
              <div style={{ fontSize: 12, color: "var(--muted, #888)" }}>
                {countryFlag(r.country ?? "")} {countryName(r.country)}
              </div>
            </div>
            <div>{r.wins}</div>
            <div>{r.losses}</div>
            <div>{r.wins + r.losses}</div>
          </div>
        );
      })}

      {rows.length === 0 && <p className="stat-secondary">No ranked players yet.</p>}
    </div>
  );
}
