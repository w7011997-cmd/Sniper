import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, MoreVertical } from "lucide-react";
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // True once I've sent at least one message and they haven't replied at
  // all yet — mirrors the enforce_first_message_limit DB trigger exactly,
  // so the input disables proactively instead of only after a failed send.
  const hasSentAny = session ? messages.some((m) => m.sender_id === session.user.id) : false;
  const hasReceivedAny = userId ? messages.some((m) => m.sender_id === userId) : false;
  const awaitingReply = hasSentAny && !hasReceivedAny;

  async function load() {
    if (!session || !userId) return;

    await supabase.rpc("delete_expired_messages");

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (profile) setOtherUsername(profile.username);

    const { data: blockRow } = await supabase
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocker_id", session.user.id)
      .eq("blocked_id", userId)
      .maybeSingle();
    setIsBlocked(!!blockRow);

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
      .channel(`thread-${session.user.id}-${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as (Message & { recipient_id: string }) | null;
          if (!row) return;
          const isThisThread =
            (row.sender_id === userId && row.recipient_id === session.user.id) ||
            (row.sender_id === session.user.id && row.recipient_id === userId);
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
    if (!draft.trim() || !session || !userId || awaitingReply) return;
    setSending(true);
    setSendError(null);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: session.user.id,
      recipient_id: userId,
      content: draft.trim(),
    });
    setSending(false);
    if (error) {
      setSendError(
        error.message.includes("AWAITING_REPLY")
          ? "You already sent a message — wait for them to reply before sending another."
          : error.message
      );
    } else {
      setDraft("");
      load();
    }
  }

  async function clearChat() {
    if (!userId) return;
    if (!window.confirm("Clear this chat? This deletes it for both of you and can't be undone.")) return;
    await supabase.rpc("clear_conversation", { p_other_user_id: userId });
    setMessages([]);
    setShowMenu(false);
  }

  async function toggleBlock() {
    if (!session || !userId) return;
    if (isBlocked) {
      await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", session.user.id)
        .eq("blocked_id", userId);
      setIsBlocked(false);
    } else {
      await supabase.from("blocked_users").insert({
        blocker_id: session.user.id,
        blocked_id: userId,
      });
      setIsBlocked(true);
    }
    setShowMenu(false);
  }

  return (
    <div className="thread-page">
      <div className="thread-header">
        <Link to="/messages" className="stat-secondary">← Back</Link>
        <h1 style={{ fontSize: 18 }}>{otherUsername || "..."}</h1>
        <div className="thread-menu-wrap">
          <button type="button" className="thread-menu-btn" onClick={() => setShowMenu((s) => !s)} aria-label="Conversation options">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="thread-menu-dropdown">
              <button type="button" onClick={clearChat}>Clear chat</button>
              <button type="button" onClick={toggleBlock} style={{ color: "var(--danger)" }}>
                {isBlocked ? "Unblock" : "Block"} {otherUsername}
              </button>
            </div>
          )}
        </div>
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

      {sendError && <p role="alert" style={{ padding: "0 16px" }}>{sendError}</p>}

      {awaitingReply && !sendError && (
        <p className="stat-secondary" style={{ padding: "0 16px", fontSize: 12 }}>
          Waiting for {otherUsername || "them"} to reply before you can send another message.
        </p>
      )}

      <div className="thread-input-row">
        <input
          placeholder={awaitingReply ? "Waiting for a reply..." : "Message..."}
          value={draft}
          disabled={awaitingReply}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          type="button"
          className="thread-send-btn"
          disabled={sending || !draft.trim() || awaitingReply}
          onClick={send}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
