import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function useChallengerAutoRedirect() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`challenger-redirect-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `challenger_id=eq.${session.user.id}`,
        },
        async (payload) => {
          const updated = payload.new as { id: string; status: string };
          if (updated.status !== "accepted") return;

          const { data: match } = await supabase
            .from("matches")
            .select("id")
            .eq("challenge_id", updated.id)
            .maybeSingle();

          if (match) {
            navigate(`/match/${match.id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, navigate]);
}
