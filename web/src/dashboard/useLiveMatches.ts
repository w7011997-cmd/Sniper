import { useEffect, useState } from "react";
import { supabase } from "../shared/supabaseClient";

export interface LiveMatch {
  id: string;
  stake_cents: number;
  player_a: string;
  player_b: string;
  playerAName: string;
  playerBName: string;
  playerAStats: { avg_rating: number; rating_count: number };
  playerBStats: { avg_rating: number; rating_count: number };
}

export function useLiveMatches() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data: rawMatches } = await supabase
      .from("matches")
      .select("id, stake_cents, player_a, player_b")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false });

    if (!rawMatches || rawMatches.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const playerIds = Array.from(
      new Set(rawMatches.flatMap((m) => [m.player_a, m.player_b]))
    );

    const { data: stats } = await supabase
      .from("player_stats")
      .select("player_id, username, avg_rating, rating_count")
      .in("player_id", playerIds);

    const byId = new Map((stats ?? []).map((s) => [s.player_id, s]));

    const combined: LiveMatch[] = rawMatches.map((m) => {
      const a = byId.get(m.player_a);
      const b = byId.get(m.player_b);
      return {
        id: m.id,
        stake_cents: m.stake_cents,
        player_a: m.player_a,
        player_b: m.player_b,
        playerAName: a?.username ?? "Player",
        playerBName: b?.username ?? "Player",
        playerAStats: { avg_rating: a?.avg_rating ?? 0, rating_count: a?.rating_count ?? 0 },
        playerBStats: { avg_rating: b?.avg_rating ?? 0, rating_count: b?.rating_count ?? 0 },
      };
    });

    setMatches(combined);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("matches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, loading, refresh: load };
}
