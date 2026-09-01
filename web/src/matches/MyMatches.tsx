import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../shared/supabaseClient";
import { useMyMatches, type MyMatch } from "./useMyMatches";

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "none", border: "none", padding: 2, lineHeight: 0 }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24">
        <path
          d="M12 2.5l2.9 6.26 6.6.78-4.9 4.6 1.28 6.6L12 17.6l-5.88 3.14 1.28-6.6-4.9-4.6 6.6-.78z"
          fill={filled ? "#fbbf24" : "none"}
          stroke={filled ? "#fbbf24" : "var(--border)"}
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );
}

export function RatingForm({ match, onDone }: { match: MyMatch; onDone: () => void }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.rpc("submit_rating", {
      p_match_id: match.id,
      p_stars: stars,
      p_comment: comment || null,
    });
    setBusy(false);
    setMessage(error ? error.message : "Rating submitted.");
    if (!error) onDone();
  }

  return (
    <div style={{ marginTop: 8 }}>
      {message && <p role="alert">{message}</p>}
      <div style={{ display: "flex" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} filled={n <= stars} onClick={() => setStars(n)} />
        ))}
      </div>
      <input
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ width: "100%", marginTop: 6 }}
      />
      <button type="button" disabled={busy} onClick={submit} style={{ marginTop: 6 }}>
        Submit rating
      </button>
    </div>
  );
}

function MatchRow({ match, onChange }: { match: MyMatch; onChange: () => void }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const myScore = match.iAmPlayerA ? match.score_a : match.score_b;
  const oppScore = match.iAmPlayerA ? match.score_b : match.score_a;

  async function forfeit() {
    if (!window.confirm("Forfeit this match? Your opponent gets the pot minus the house cut.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("forfeit_match", { p_match_id: match.id });
    setBusy(false);
    setMessage(error ? error.message : "Match forfeited.");
    onChange();
  }

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        vs {match.opponentName} — 🪙{(match.stake_cents / 100).toFixed(2)} pot
      </div>
      <div className="stat-secondary">
        {match.status}
        {match.status === "in_progress" &&
          ` — round ${match.current_round}/${match.rounds}, score ${myScore}-${oppScore}`}
      </div>

      {match.status === "in_progress" && (
        <button
          type="button"
          onClick={() => navigate(`/match/${match.id}`)}
          style={{ marginTop: 8 }}
        >
          Play match
        </button>
      )}

      {message && <p role="alert">{message}</p>}

      {match.status === "in_progress" && (
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={forfeit} style={{ color: "var(--danger)" }}>
            Forfeit match
          </button>
        </div>
      )}

      {match.status === "completed" && !match.alreadyRated && (
        <RatingForm match={match} onDone={onChange} />
      )}
      {match.status === "completed" && match.alreadyRated && (
        <p className="stat-secondary">You rated this match.</p>
      )}
    </div>
  );
}

export default function MyMatches() {
  const { matches, refresh } = useMyMatches();

  if (matches.length === 0) return null;

  return (
    <div>
      <h2>My matches</h2>
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} onChange={refresh} />
      ))}
    </div>
  );
}
