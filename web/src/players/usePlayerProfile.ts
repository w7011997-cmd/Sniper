import { useEffect, useState } from "react";
import { supabase } from "../shared/supabaseClient";

export interface PublicMatch {
  won: boolean;
  opponentId: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
  endedAt: string | null;
}

export interface PublicReview {
  raterId: string;
  raterName: string;
  stars: number;
  comment: string | null;
  createdAt: string | null;
}

export interface PublicProfile {
  username: string;
  createdAt: string | null;
  wins: number;
  losses: number;
  avgRating: number;
  ratingCount: number;
  rank: number | null;
  recentMatches: PublicMatch[];
  reviews: PublicReview[];
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
    rank: null,
    recentMatches: [],
    reviews: [],
    loading: true,
    notFound: false,
  });

  useEffect(() => {
    if (!playerId) return;

    async function load() {
      const [{ data: profile }, { data: stats }, { data: matches }, { count: rankAbove }, { data: ratings }] =
        await Promise.all([
          supabase.from("profiles").select("username, created_at").eq("id", playerId).single(),
          supabase.from("player_stats").select("avg_rating, rating_count, wins, losses").eq("player_id", playerId).single(),
          supabase
            .from("matches")
            .select("id, winner_id, player_a, player_b, score_a, score_b, ended_at")
            .eq("status", "completed")
            .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
            .order("ended_at", { ascending: false })
            .limit(10),
          (async () => {
            const { data: mine } = await supabase.from("player_stats").select("wins").eq("player_id", playerId).single();
            if (!mine) return { count: null };
            return supabase
              .from("player_stats")
              .select("player_id", { count: "exact", head: true })
              .gt("wins", mine.wins);
          })(),
          supabase
            .from("ratings")
            .select("stars, comment, created_at, rater_id, rater:rater_id(username)")
            .eq("rated_player", playerId)
            .order("created_at", { ascending: false })
            .limit(10),
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

      const recentMatches: PublicMatch[] = (matches ?? []).map((m) => {
        const isPlayerA = m.player_a === playerId;
        const oppId = isPlayerA ? m.player_b : m.player_a;
        return {
          won: m.winner_id === playerId,
          opponentId: oppId,
          opponentName: nameById.get(oppId) ?? "opponent",
          myScore: isPlayerA ? m.score_a : m.score_b,
          opponentScore: isPlayerA ? m.score_b : m.score_a,
          endedAt: m.ended_at,
        };
      });

      const reviews: PublicReview[] = (ratings ?? []).map((r: any) => ({
        raterId: r.rater_id,
        raterName: r.rater?.username ?? "Player",
        stars: r.stars,
        comment: r.comment,
        createdAt: r.created_at,
      }));

      setState({
        username: profile.username,
        createdAt: profile.created_at,
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        avgRating: stats?.avg_rating ?? 0,
        ratingCount: stats?.rating_count ?? 0,
        rank: rankAbove !== null ? rankAbove + 1 : null,
        recentMatches,
        reviews,
        loading: false,
        notFound: false,
      });
    }

    load();
  }, [playerId]);

  return state;
}
