import { useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { supabase } from "../shared/supabaseClient";
import { useConversations } from "./useConversations";
import WalletWarningBanner from "../shared/WalletWarningBanner";
import MessageSettingsPanel from "./MessageSettingsPanel";
import "./messages.css";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export default function MessagesPage() {
  const { conversations, loading } = useConversations();
  const [searching, setSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);

  async function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${value.trim()}%`)
      .limit(10);
    setResults(data ?? []);
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h1>Messages</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setSearching((s) => !s)}>
            {searching ? "Cancel" : "New message"}
          </button>
          <button
            type="button"
            className="messages-settings-btn"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Message settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <WalletWarningBanner />

      {showSettings && <MessageSettingsPanel />}

      {searching && (
        <div className="messages-search">
          <input
            placeholder="Search username..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {results.map((r) => (
            <Link key={r.id} to={`/messages/${r.id}`} className="messages-search-result">
              {r.username}
            </Link>
          ))}
          {query && results.length === 0 && (
            <p className="stat-secondary">No players found.</p>
          )}
        </div>
      )}

      {loading && <p className="stat-secondary">Loading...</p>}

      {!loading && conversations.length === 0 && !searching && (
        <p className="stat-secondary">
          No conversations yet — tap "New message" to reach out to a player.
        </p>
      )}

      {conversations.map((c) => (
        <Link key={c.other_user_id} to={`/messages/${c.other_user_id}`} className="conversation-row">
          <div className="conversation-avatar">{c.other_username.charAt(0).toUpperCase()}</div>
          <div className="conversation-body">
            <div className="conversation-name">{c.other_username}</div>
            <div className="conversation-preview">{c.last_message}</div>
          </div>
          <div className="conversation-meta">
            <div className="conversation-time">{timeAgo(c.last_message_at)}</div>
            {c.unread_count > 0 && (
              <div className="conversation-unread">{c.unread_count > 9 ? "9+" : c.unread_count}</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
