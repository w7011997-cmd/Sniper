import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

interface Profile {
  id: string;
  username: string;
}

export default function PlayerList() {
  const { session } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [stakeInputs, setStakeInputs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, [session?.user.id]);

  async function loadPlayers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .neq("id", session?.user.id ?? "");
    setPlayers(data ?? []);
  }

  async function sendChallenge(opponentId: string) {
    const raw = stakeInputs[opponentId];
    const naira = Number(raw);
    if (!raw || isNaN(naira) || naira <= 0) {
      setMessage("Enter a valid stake amount first.");
      return;
    }

    setBusyId(opponentId);
    setMessage(null);

    const { error } = await supabase.from("challenges").insert({
      challenger_id: session?.user.id,
      opponent_id: opponentId,
      stake_cents: Math.round(naira * 100),
    });

    setBusyId(null);
    setMessage(error ? error.message : "Challenge sent.");
  }

  return (
    <div>
      <h2>Players</h2>
      {message && <p role="alert">{message}</p>}
      {players.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Link to={`/players/${p.id}`} className="player-link" style={{ flex: 1 }}>{p.username}</Link>
          <input
            type="number"
            placeholder="🪙 stake"
            style={{ width: 90 }}
            value={stakeInputs[p.id] ?? ""}
            onChange={(e) =>
              setStakeInputs({ ...stakeInputs, [p.id]: e.target.value })
            }
          />
          <button
            type="button"
            disabled={busyId === p.id}
            onClick={() => sendChallenge(p.id)}
          >
            Challenge
          </button>
        </div>
      ))}
    </div>
  );
}
