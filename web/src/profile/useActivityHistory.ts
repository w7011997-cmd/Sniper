import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import type { ActivityItem } from "./useProfileData";

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

export function useActivityHistory() {
  const { session } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    setLoading(true);
    const uid = session.user.id;

    const [{ data: profile }, { data: matches }] = await Promise.all([
      supabase.from("profiles").select("created_at").eq("id", uid).single(),
      supabase
        .from("matches")
        .select("id, winner_id, player_a, player_b, ended_at")
        .eq("status", "completed")
        .or(`player_a.eq.${uid},player_b.eq.${uid}`)
        .order("ended_at", { ascending: false }),
    ]);

    const opponentIds = (matches ?? []).map((m) => (m.player_a === uid ? m.player_b : m.player_a));
    const { data: opponents } = opponentIds.length
      ? await supabase.from("profiles").select("id, username").in("id", opponentIds)
      : { data: [] as { id: string; username: string }[] };
    const nameById = new Map((opponents ?? []).map((o) => [o.id, o.username]));

    const matchActivity: ActivityItem[] = (matches ?? []).map((m) => {
      const won = m.winner_id === uid;
      const opponent = nameById.get(m.player_a === uid ? m.player_b : m.player_a) ?? "opponent";
      return {
        kind: won ? "win" : "loss",
        label: won ? "Match won" : "Match lost",
        sub: `vs ${opponent}`,
        time: m.ended_at ? timeAgo(m.ended_at) : "",
      };
    });

    const accountActivity: ActivityItem[] = profile?.created_at
      ? [
          { kind: "account", label: "Welcome to Sniper!", sub: "Account created", time: timeAgo(profile.created_at) },
          { kind: "wallet", label: "Wallet created", sub: "Fund your wallet", time: timeAgo(profile.created_at) },
        ]
      : [];

    setActivity([...matchActivity, ...accountActivity]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session?.user.id]);

  return { activity, loading, refresh: load };
}
