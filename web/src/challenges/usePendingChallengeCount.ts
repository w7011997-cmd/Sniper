import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function usePendingChallengeCount() {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  async function load() {
    if (!session) return;
    const { count: c } = await supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("opponent_id", session.user.id)
      .eq("status", "pending");
    setCount(c ?? 0);
  }

  useEffect(() => {
    if (!session) return;
    load();

    const channel = supabase
      .channel(`pending-challenges-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
          filter: `opponent_id=eq.${session.user.id}`,
        },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  return count;
}
