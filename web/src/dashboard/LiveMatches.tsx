import { useState } from "react";
import { supabase } from "../shared/supabaseClient";
import { useLiveMatches, type LiveMatch } from "./useLiveMatches";

function Avatar({ name }: { name: string }) {
  return <div className="avatar-circle">{name.charAt(0).toUpperCase()}</div>;
}

function Stars({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <span className="stat-secondary">No ratings yet</span>;
  return (
    <span>
      ★ {avg.toFixed(1)} <span className="stat-secondary">({count})</span>
    </span>
  );
}

function MatchCard({ match, onBet }: { match: LiveMatch; onBet: (m: LiveMatch, backedPlayer: string) => void }) {
  return (
    <div className="match-card">
      <div className="live-badge">● LIVE</div>
      <div className="match-players">
        <div className="match-player">
          <Avatar name={match.playerAName} />
          <div>{match.playerAName}</div>
          <Stars avg={match.playerAStats.avg_rating} count={match.playerAStats.rating_count} />
        </div>
        <div className="match-vs">VS</div>
        <div className="match-player">
          <Avatar name={match.playerBName} />
          <div>{match.playerBName}</div>
          <Stars avg={match.playerBStats.avg_rating} count={match.playerBStats.rating_count} />
        </div>
      </div>
      <p className="stat-secondary" style={{ textAlign: "center" }}>
        Round {match.current_round}/{match.rounds} — Stake: 🪙{(match.stake_cents / 100).toFixed(2)} each
      </p>
      <div className="bet-row">
        <button className="bet-btn bet-btn-a" onClick={() => onBet(match, match.player_a)}>
          Bet on {match.playerAName}
        </button>
        <button className="bet-btn bet-btn-b" onClick={() => onBet(match, match.player_b)}>
          Bet on {match.playerBName}
        </button>
      </div>
    </div>
  );
}

export default function LiveMatches() {
  const { matches, loading, refresh } = useLiveMatches();
  const [message, setMessage] = useState<string | null>(null);

  async function handleBet(match: LiveMatch, backedPlayer: string) {
    const raw = window.prompt("How much do you want to bet (🪙)?");
    const naira = Number(raw);
    if (!raw || isNaN(naira) || naira <= 0) return;

    const { error } = await supabase.rpc("place_spectator_bet", {
      p_match_id: match.id,
      p_backed_player: backedPlayer,
      p_amount_cents: Math.round(naira * 100),
    });

    setMessage(error ? error.message : "Bet placed.");
    refresh();
  }

  return (
    <div>
      <h1>Live Matches</h1>
      {message && <p role="alert">{message}</p>}
      {loading && <p className="stat-secondary">Loading...</p>}
      {!loading && matches.length === 0 && (
        <p className="stat-secondary">No live matches right now — accept a challenge to start one.</p>
      )}
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} onBet={handleBet} />
      ))}
    </div>
  );
}
