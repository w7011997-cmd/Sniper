import { useEffect, useState } from "react";
import { supabase } from "../shared/supabaseClient";

export interface PublicMatch {
  won: boolean;
  opponentName: string;
  stakeCents: number;
  endedAt: string | null;
}

export interface PublicProfile {
  username: string;
  createdAt: string | null;
  wins: number;
  losses: number;
  avgRating: number;
  ratingCount: number;
  recentMatches: PublicMatch[];
  loading: boolean;
  notFound: boolean;
}

export function usePlayerProfile(playerId: string | undefined) {
  const [state, setState] = useState<PublicProfile>({
    username: "",
    createdAt: null,
    wins: 0,
    losses: 0,
    avgRating: 0,
    ratingCount: 0,
    recentMatches: [],
    loading: true,
    notFound: false,
  });

  useEffect(() => {
    if (!playerId) return;

    async function load() {
      const [{ data: profile }, { data: stats }, { data: matches }] = await Promise.all([
        supabase.from("profiles").select("username, created_at").eq("id", playerId).single(),
        supabase.from("player_stats").select("avg_rating, rating_count, wins, losses").eq("player_id", playerId).single(),
        supabase
          .from("matches")
          .select("id, stake_cents, winner_id, player_a, player_b, ended_at")
          .eq("status", "completed")
          .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
          .order("ended_at", { ascending: false })
          .limit(5),
      ]);

      if (!profile) {
        setState((s) => ({ ...s, loading: false, notFound: true }));
        return;
      }

      const opponentIds = (matches ?? []).map((m) => (m.player_a === playerId ? m.player_b : m.player_a));
      const { data: opponents } = opponentIds.length
        ? await supabase.from("profiles").select("id, username").in("id", opponentIds)
        : { data: [] as { id: string; username: string }[] };
      const nameById = new Map((opponents ?? []).map((o) => [o.id, o.username]));

      const recentMatches: PublicMatch[] = (matches ?? []).map((m) => ({
        won: m.winner_id === playerId,
        opponentName: nameById.get(m.player_a === playerId ? m.player_b : m.player_a) ?? "opponent",
        stakeCents: m.stake_cents,
        endedAt: m.ended_at,
      }));

      setState({
        username: profile.username,
        createdAt: profile.created_at,
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        avgRating: stats?.avg_rating ?? 0,
        ratingCount: stats?.rating_count ?? 0,
        recentMatches,
        loading: false,
        notFound: false,
      });
    }

    load();
  }, [playerId]);

  return state;
}
