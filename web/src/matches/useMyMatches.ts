import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export interface MyMatch {
  id: string;
  status: string;
  stake_cents: number;
  player_a: string;
  player_b: string;
  winner_id: string | null;
  opponentName: string;
  iAmPlayerA: boolean;
  alreadyRated: boolean;
}

export function useMyMatches() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<MyMatch[]>([]);

  async function load() {
    if (!session) return;
    const uid = session.user.id;

    const { data: rawMatches } = await supabase
      .from("matches")
      .select("id, status, stake_cents, player_a, player_b, winner_id")
      .in("status", ["in_progress", "completed"])
      .or(`player_a.eq.${uid},player_b.eq.${uid}`)
      .order("started_at", { ascending: false });

    if (!rawMatches || rawMatches.length === 0) {
      setMatches([]);
      return;
    }

    const opponentIds = rawMatches.map((m) => (m.player_a === uid ? m.player_b : m.player_a));
    const { data: opponents } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", opponentIds);
    const nameById = new Map((opponents ?? []).map((o) => [o.id, o.username]));

    const matchIds = rawMatches.map((m) => m.id);
    const { data: myRatings } = await supabase
      .from("ratings")
      .select("match_id")
      .eq("rater_id", uid)
      .in("match_id", matchIds);
    const ratedSet = new Set((myRatings ?? []).map((r) => r.match_id));

    setMatches(
      rawMatches.map((m) => ({
        ...m,
        opponentName: nameById.get(m.player_a === uid ? m.player_b : m.player_a) ?? "Opponent",
        iAmPlayerA: m.player_a === uid,
        alreadyRated: ratedSet.has(m.id),
      }))
    );
  }

  useEffect(() => {
    load();
  }, [session?.user.id]);

  return { matches, refresh: load };
}
