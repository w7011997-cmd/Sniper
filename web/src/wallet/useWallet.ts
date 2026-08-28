import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function useWallet() {
  const { session } = useAuth();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);

  async function refresh() {
    if (!session) return;
    const { data } = await supabase
      .from("wallets")
      .select("balance_cents")
      .eq("user_id", session.user.id)
      .single();
    setBalanceCents(data?.balance_cents ?? null);
  }

  useEffect(() => {
    refresh();
  }, [session?.user.id]);

  return { balanceCents, refresh };
}
