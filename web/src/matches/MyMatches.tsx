import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { useMyMatches, type MyMatch } from "./useMyMatches";

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
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            style={{ background: "none", border: "none", fontSize: 20, padding: 2 }}
          >
            {n <= stars ? "★" : "☆"}
          </button>
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
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const myScore = match.iAmPlayerA ? match.score_a : match.score_b;
  const oppScore = match.iAmPlayerA ? match.score_b : match.score_a;

  async function reportRound(iWonRound: boolean) {
    setBusy(true);
    const winnerId = iWonRound
      ? session?.user.id
      : match.iAmPlayerA
      ? match.player_b
      : match.player_a;
    const { data, error } = await supabase.rpc("report_round_result", {
      p_match_id: match.id,
      p_round_winner: winnerId,
    });
    setBusy(false);
    setMessage(
      error
        ? error.message
        : data === "settled"
        ? "Match complete — settled."
        : data === "tied_disputed"
        ? "Match ended tied — flagged for manual review."
        : data === "disputed"
        ? "Your report doesn't match your opponent's — marked as disputed."
        : data === "round_recorded"
        ? "Round recorded — on to the next one."
        : "Waiting on your opponent to confirm this round."
    );
    onChange();
  }

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
        vs {match.opponentName} — 🪙{(match.stake_cents / 100).toFixed(2)}
      </div>
      <div className="stat-secondary">
        {match.status}
        {match.status === "in_progress" &&
          ` — round ${match.current_round}/${match.rounds}, score ${myScore}-${oppScore}`}
      </div>

      {match.status === "in_progress" && (
        <Link to={`/match/${match.id}`} style={{ color: "var(--accent)", display: "inline-block", marginTop: 6 }}>
          Play match →
        </Link>
      )}

      {message && <p role="alert">{message}</p>}

      {match.status === "in_progress" && (
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => reportRound(true)}>
            I won this round
          </button>
          <button type="button" disabled={busy} onClick={() => reportRound(false)}>
            I lost this round
          </button>
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
