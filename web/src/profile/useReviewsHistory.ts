import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import type { Review } from "./useProfileData";

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

export function useReviewsHistory() {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session) return;
    setLoading(true);
    const uid = session.user.id;

    const { data: ratings } = await supabase
      .from("ratings")
      .select("stars, comment, created_at, rater:rater_id(username)")
      .eq("rated_player", uid)
      .order("created_at", { ascending: false });

    const reviewItems: Review[] = (ratings ?? []).map((r: any) => ({
      raterName: r.rater?.username ?? "Player",
      stars: r.stars,
      comment: r.comment,
      time: r.created_at ? timeAgo(r.created_at) : "",
    }));

    setReviews(reviewItems);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session?.user.id]);

  return { reviews, loading, refresh: load };
}
