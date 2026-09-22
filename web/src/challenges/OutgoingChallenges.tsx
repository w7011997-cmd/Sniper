import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

interface OutgoingChallenge {
  id: string;
  status: string;
  opponent: { id: string; username: string } | null;
  matchId: string | null;
}

export default function OutgoingChallenges() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<OutgoingChallenge[]>([]);

  async function load() {
    if (!session) return;
    const { data: rows } = await supabase
      .from("challenges")
      .select("id, status, opponent:opponent_id(id, username)")
      .eq("challenger_id", session.user.id)
      .in("status", ["pending", "accepted"]);

    const list = (rows as any[]) ?? [];
    const acceptedIds = list.filter((c) => c.status === "accepted").map((c) => c.id);

    let matchByChallenge: Record<string, string> = {};
    if (acceptedIds.length > 0) {
      const { data: liveMatches } = await supabase
        .from("matches")
        .select("id, challenge_id")
        .in("challenge_id", acceptedIds)
        .neq("status", "completed");
      (liveMatches ?? []).forEach((m) => (matchByChallenge[m.challenge_id] = m.id));
    }

    setChallenges(
      list.map((c) => ({
        id: c.id,
        status: c.status,
        opponent: c.opponent,
        matchId: matchByChallenge[c.id] ?? null,
      }))
    );
  }

  useEffect(() => {
    load();
    if (!session) return;

    const channel = supabase
      .channel(`outgoing-challenges-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `challenger_id=eq.${session.user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  if (challenges.length === 0) return null;

  return (
    <div>
      <h2>Sent challenges</h2>
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
          <span style={{ flex: 1 }}>{c.opponent?.username ?? "Someone"}</span>
          {c.status === "accepted" && c.matchId ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <button type="button" onClick={() => navigate(`/match/${c.matchId}`)}>
                Enter Match
              </button>
              <span className="stat-secondary" style={{ fontSize: 11 }}>
                {c.opponent?.username ?? "They"} accepted your challenge
              </span>
            </div>
          ) : (
            <span className="stat-secondary">Waiting for response</span>
          )}
        </div>
      ))}
    </div>
  );
}
