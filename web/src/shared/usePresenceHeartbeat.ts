import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export function usePresenceHeartbeat() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;

    const ping = () => {
      supabase.rpc("heartbeat");
    };

    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, [session]);
}
