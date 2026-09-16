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
  const [roundsInputs, setRoundsInputs] = useState<Record<string, number>>({});
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
    const rounds = roundsInputs[opponentId] ?? 4;

    setBusyId(opponentId);
    setMessage(null);

    const { error } = await supabase.from("challenges").insert({
      challenger_id: session?.user.id,
      opponent_id: opponentId,
      rounds,
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
            padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Link to={`/players/${p.id}`} className="player-link">{p.username}</Link>
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
            <select
              value={roundsInputs[p.id] ?? 4}
              onChange={(e) =>
                setRoundsInputs({ ...roundsInputs, [p.id]: Number(e.target.value) })
              }
            >
              <option value={4}>4 rounds</option>
              <option value={6}>6 rounds</option>
              <option value={8}>8 rounds</option>
            </select>
            <button
              type="button"
              disabled={busyId === p.id}
              onClick={() => sendChallenge(p.id)}
            >
              Challenge
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
