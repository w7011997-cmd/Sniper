import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import "./findOpponent.css";

interface PlayerRow {
  player_id: string;
  username: string;
  avg_rating: number;
  rating_count: number;
  wins: number;
  losses: number;
  is_online: boolean;
  in_active_match: boolean;
}

type FilterMode = "all" | "top_rated" | "new_players" | "most_wins";

export default function FindOpponent() {
  const { session } = useAuth();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("player_stats")
      .select("player_id, username, avg_rating, rating_count, wins, losses, is_online, in_active_match");
    setPlayers((data ?? []).filter((p) => p.player_id !== session?.user.id));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [session]);

  const onlineCount = useMemo(() => players.filter((p) => p.is_online).length, [players]);
  const availableCount = useMemo(
    () => players.filter((p) => p.is_online && !p.in_active_match).length,
    [players]
  );

  const visible = useMemo(() => {
    let list = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.username.toLowerCase().includes(q));
    }
    if (filter === "top_rated") {
      list = [...list].sort((a, b) => b.avg_rating - a.avg_rating);
    } else if (filter === "new_players") {
      list = list.filter((p) => p.rating_count === 0);
    } else if (filter === "most_wins") {
      list = [...list].sort((a, b) => b.wins - a.wins);
    }
    return list;
  }, [players, search, filter]);

  async function sendChallenge(opponentId: string) {
    const raw = window.prompt("Stake amount (🪙)?");
    const naira = Number(raw);
    if (!raw || isNaN(naira) || naira <= 0) return;

    const { error } = await supabase.from("challenges").insert({
      challenger_id: session?.user.id,
      opponent_id: opponentId,
      stake_cents: Math.round(naira * 100),
    });

    setMessage(error ? error.message : "Challenge sent.");
  }

  return (
    <div className="find-opponent">
      <h1>Find Opponent</h1>

      <div className="fo-stats-banner">
        <div>
          <div className="fo-stat-number">
            {onlineCount} <span className="fo-online-dot" />
          </div>
          <div className="fo-stat-label">Online</div>
        </div>
        <div className="fo-stats-divider" />
        <div>
          <div className="fo-stat-number">{availableCount}</div>
          <div className="fo-stat-label">Ready to Play</div>
        </div>
      </div>

      <input
        className="fo-search"
        placeholder="Search username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="fo-filters">
        {(
          [
            ["all", "All"],
            ["top_rated", "Top Rated"],
            ["new_players", "New Players"],
            ["most_wins", "Most Wins"],
          ] as [FilterMode, string][]
        ).map(([mode, label]) => (
          <button
            key={mode}
            className={"fo-chip" + (filter === mode ? " fo-chip-active" : "")}
            onClick={() => setFilter(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <p role="alert">{message}</p>}

      <div className="fo-list-header">
        {filter === "all" ? "All players" : filter === "top_rated" ? "Top rated" : filter === "new_players" ? "New players" : "Most wins"}
        {" — "}
        {visible.length}
      </div>

      {visible.length === 0 && <p className="stat-secondary">No players match.</p>}

      {visible.map((p) => (
        <div key={p.player_id} className="fo-card">
          <div className="fo-info">
            <div className="fo-username">
              {p.is_online && <span className="fo-online-inline-dot" />}
              {p.username}
            </div>
            <div className="fo-substats">
              {p.rating_count > 0 ? (
                <span>★ {p.avg_rating.toFixed(1)} ({p.rating_count} reviews)</span>
              ) : (
                <span className="stat-secondary">No ratings yet</span>
              )}
            </div>
          </div>
          <div className="fo-trophy">
            <div className="fo-trophy-number">{p.wins}</div>
            <div className="fo-stat-label">Wins</div>
          </div>
          {p.in_active_match ? (
            <span className="fo-in-match">In a match</span>
          ) : (
            <button className="fo-challenge-btn" onClick={() => sendChallenge(p.player_id)}>
              Challenge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
