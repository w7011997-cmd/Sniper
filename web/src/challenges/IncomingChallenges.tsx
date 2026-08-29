import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

interface IncomingChallenge {
  id: string;
  stake_cents: number;
  challenger: { username: string } | null;
}

export default function IncomingChallenges() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<IncomingChallenge[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [session?.user.id]);

  async function load() {
    const { data } = await supabase
      .from("challenges")
      .select("id, stake_cents, challenger:challenger_id(username)")
      .eq("opponent_id", session?.user.id ?? "")
      .eq("status", "pending");
    setChallenges((data as any) ?? []);
  }

  async function respond(id: string, accept: boolean) {
    setBusyId(id);
    setMessage(null);

    if (accept) {
      const { data, error } = await supabase.rpc("accept_challenge", { challenge_id: id });
      setBusyId(null);
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data) {
        navigate(`/match/${data}`);
        return;
      }
      load();
      return;
    }

    const { error } = await supabase.rpc("decline_challenge", { challenge_id: id });
    setBusyId(null);
    setMessage(error ? error.message : "Challenge declined.");
    load();
  }

  if (challenges.length === 0) return null;

  return (
    <div>
      <h2>Incoming challenges</h2>
      {message && <p role="alert">{message}</p>}
      {challenges.map((c) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ flex: 1 }}>
            {c.challenger?.username ?? "Someone"} — 🪙{(c.stake_cents / 100).toFixed(2)}
          </span>
          <button type="button" disabled={busyId === c.id} onClick={() => respond(c.id, true)}>
            Accept
          </button>
          <button type="button" disabled={busyId === c.id} onClick={() => respond(c.id, false)}>
            Decline
          </button>
        </div>
      ))}
    </div>
  );
}
