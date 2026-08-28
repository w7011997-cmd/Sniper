import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { useMyMatches, type MyMatch } from "./useMyMatches";

function RatingForm({ match, onDone }: { match: MyMatch; onDone: () => void }) {
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

  async function reportResult(iWon: boolean) {
    setBusy(true);
    const winnerId = iWon ? session?.user.id : match.iAmPlayerA ? match.player_b : match.player_a;
    const { data, error } = await supabase.rpc("report_match_result", {
      p_match_id: match.id,
      p_winner_id: winnerId,
    });
    setBusy(false);
    setMessage(
      error
        ? error.message
        : data === "settled"
        ? "Match settled."
        : data === "disputed"
        ? "Your report doesn't match your opponent's — marked as disputed."
        : "Result recorded — waiting on your opponent to confirm."
    );
    onChange();
  }

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        vs {match.opponentName} — 🪙{(match.stake_cents / 100).toFixed(2)} pot
      </div>
      <div className="stat-secondary">{match.status}</div>
      {message && <p role="alert">{message}</p>}

      {match.status === "in_progress" && (
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button type="button" disabled={busy} onClick={() => reportResult(true)}>
            I won
          </button>
          <button type="button" disabled={busy} onClick={() => reportResult(false)}>
            I lost
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
