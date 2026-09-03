import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import "./messages.css";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ConversationThread() {
  const { userId } = useParams<{ userId: string }>();
  const { session } = useAuth();
  const [otherUsername, setOtherUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!session || !userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (profile) setOtherUsername(profile.username);

    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, content, created_at")
      .or(
        `and(sender_id.eq.${session.user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${session.user.id})`
      )
      .order("created_at", { ascending: true });
    setMessages(data ?? []);

    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", userId)
      .eq("recipient_id", session.user.id)
      .is("read_at", null);
  }

  useEffect(() => {
    load();
    if (!session || !userId) return;

    const channel = supabase
      .channel(`thread-${session.user.id}-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const m = payload.new as Message & { recipient_id: string };
          const isThisThread =
            (m.sender_id === userId && m.recipient_id === session.user.id) ||
            (m.sender_id === session.user.id && m.recipient_id === userId);
          if (isThisThread) load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!draft.trim() || !session || !userId) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: session.user.id,
      recipient_id: userId,
      content: draft.trim(),
    });
    setSending(false);
    if (!error) {
      setDraft("");
      load();
    }
  }

  return (
    <div className="thread-page">
      <div className="thread-header">
        <Link to="/messages" className="stat-secondary">← Back</Link>
        <h1 style={{ fontSize: 18 }}>{otherUsername || "..."}</h1>
        <div style={{ width: 40 }} />
      </div>

      <div className="thread-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={"thread-bubble " + (m.sender_id === session?.user.id ? "thread-bubble-mine" : "thread-bubble-theirs")}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="thread-input-row">
        <input
          placeholder="Message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          type="button"
          className="thread-send-btn"
          disabled={sending || !draft.trim()}
          onClick={send}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
