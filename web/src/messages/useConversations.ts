import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export interface Conversation {
  other_user_id: string;
  other_username: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    await supabase.rpc("delete_expired_messages");
    const { data } = await supabase.rpc("get_my_conversations");
    setConversations(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    load();

    // Unique per hook instance, not just per user \u2014 BottomNav's badge and
    // MessagesPage's list both use this hook at the same time, and reusing
    // one channel name across them made the second subscribe() throw.
    const channel = supabase
      .channel(`conversations-${session.user.id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return { conversations, loading, totalUnread, refresh: load };
}
