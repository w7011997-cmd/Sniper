import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export type ActivityKind = "win" | "loss" | "account" | "wallet";

export interface ActivityItem {
  kind: ActivityKind;
  label: string;
  sub: string;
  time: string;
}

export interface Review {
  raterName: string;
  stars: number;
  comment: string | null;
  time: string;
}

export interface ProfileData {
  username: string;
  email: string;
  createdAt: string | null;
  balanceCents: number | null;
  wins: number;
  losses: number;
  avgRating: number;
  ratingCount: number;
  winStreak: number;
  rank: number | null;
  activity: ActivityItem[];
  reviews: Review[];
  loading: boolean;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useProfileData(): ProfileData {
  const { session } = useAuth();
  const [state, setState] = useState<ProfileData>({
    username: "",
    email: "",
    createdAt: null,
    balanceCents: null,
    wins: 0,
    losses: 0,
    avgRating: 0,
    ratingCount: 0,
    winStreak: 0,
    rank: null,
    activity: [],
    reviews: [],
    loading: true,
  });

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;
    const userEmail = session.user.email ?? "";

    async function load() {
      const [{ data: profile }, { data: wallet }, { data: stats }, { data: matches }, { count: rankAbove }, { data: ratings }] = await Promise.all([
        supabase.from("profiles").select("username, created_at").eq("id", uid).single(),
        supabase.from("wallets").select("balance_cents").eq("user_id", uid).single(),
        supabase.from("player_stats").select("avg_rating, rating_count, wins, losses").eq("player_id", uid).single(),
        supabase
          .from("matches")
          .select("id, winner_id, player_a, player_b, ended_at")
          .eq("status", "completed")
          .or(`player_a.eq.${uid},player_b.eq.${uid}`)
          .order("ended_at", { ascending: false })
          .limit(5),
        (async () => {
          const { data: mine } = await supabase.from("player_stats").select("wins").eq("player_id", uid).single();
          if (!mine) return { count: null };
          return supabase
            .from("player_stats")
            .select("player_id", { count: "exact", head: true })
            .gt("wins", mine.wins);
        })(),
        supabase
          .from("ratings")
          .select("stars, comment, created_at, rater:rater_id(username)")
          .eq("rated_player", uid)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      let winStreak = 0;
      const opponentIds = (matches ?? []).map((m) => (m.player_a === uid ? m.player_b : m.player_a));
      const { data: opponents } = opponentIds.length
        ? await supabase.from("profiles").select("id, username").in("id", opponentIds)
        : { data: [] as { id: string; username: string }[] };
      const nameById = new Map((opponents ?? []).map((o) => [o.id, o.username]));

      const matchActivity: ActivityItem[] = [];
      for (const m of matches ?? []) {
        const won = m.winner_id === uid;
        if (won && winStreak === matchActivity.length) winStreak++;
        const opponent = nameById.get(m.player_a === uid ? m.player_b : m.player_a) ?? "opponent";
        matchActivity.push({
          kind: won ? "win" : "loss",
          label: won ? "Match won" : "Match lost",
          sub: `vs ${opponent}`,
          time: m.ended_at ? timeAgo(m.ended_at) : "",
        });
      }

      const accountActivity: ActivityItem[] = profile?.created_at
        ? [
            { kind: "account", label: "Welcome to Sniper!", sub: "Account created", time: timeAgo(profile.created_at) },
            { kind: "wallet", label: "Wallet created", sub: "Fund your wallet", time: timeAgo(profile.created_at) },
          ]
        : [];

      const reviewItems: Review[] = (ratings ?? []).map((r: any) => ({
        raterName: r.rater?.username ?? "Player",
        stars: r.stars,
        comment: r.comment,
        time: r.created_at ? timeAgo(r.created_at) : "",
      }));

      setState({
        username: profile?.username ?? "",
        email: userEmail,
        createdAt: profile?.created_at ?? null,
        balanceCents: wallet?.balance_cents ?? null,
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        avgRating: stats?.avg_rating ?? 0,
        ratingCount: stats?.rating_count ?? 0,
        winStreak,
        rank: rankAbove !== null ? rankAbove + 1 : null,
        activity: [...matchActivity, ...accountActivity],
        reviews: reviewItems,
        loading: false,
      });
    }

    load();
  }, [session?.user.id]);

  return state;
}
