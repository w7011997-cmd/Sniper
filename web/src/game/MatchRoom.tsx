import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { RatingForm } from "../matches/MyMatches";

const ENGINE_BASE_URL = "https://w7011997-cmd.github.io/billiards";
const RELAY_URL = "wss://billiards-network.onrender.com";

interface MatchRow {
  id: string;
  status: string;
  stake_cents: number;
  player_a: string;
  player_b: string;
  winner_id: string | null;
  rounds: number;
  score_a: number;
  score_b: number;
  current_round: number;
}

export default function MatchRoom() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyRated, setAlreadyRated] = useState(false);

  async function load() {
    if (!id || !session) return;
    const { data: m } = await supabase
      .from("matches")
      .select(
        "id, status, stake_cents, player_a, player_b, winner_id, rounds, score_a, score_b, current_round"
      )
      .eq("id", id)
      .single();
    if (!m) return;
    setMatch(m);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", [m.player_a, m.player_b]);
    const map: Record<string, string> = {};
    (profiles ?? []).forEach((p) => (map[p.id] = p.username));
    setNames(map);

    if (m.status === "completed") {
      const { data: rating } = await supabase
        .from("ratings")
        .select("id")
        .eq("match_id", m.id)
        .eq("rater_id", session.user.id)
        .maybeSingle();
      setAlreadyRated(!!rating);
    }
  }

  useEffect(() => {
    load();
    if (!id) return;
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, session?.user.id]);

  async function reportRound(iWonRound: boolean) {
    if (!match || !session) return;
    setBusy(true);
    const isPlayerA = session.user.id === match.player_a;
    const winnerId = iWonRound
      ? session.user.id
      : isPlayerA
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
    load();
  }

  async function forfeit() {
    if (!match) return;
    if (!window.confirm("Forfeit this match? Your opponent gets the pot minus the house cut.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("forfeit_match", { p_match_id: match.id });
    setBusy(false);
    setMessage(error ? error.message : "Match forfeited.");
    load();
  }

  async function requestRematch() {
    if (!match) return;
    const raw = window.prompt("Stake amount for the rematch (coins)?");
    const coins = Number(raw);
    if (!raw || isNaN(coins) || coins <= 0) return;

    setBusy(true);
    const { error } = await supabase.rpc("request_rematch", {
      p_match_id: match.id,
      p_stake_cents: Math.round(coins * 100),
    });
    setBusy(false);
    setMessage(error ? error.message : "Rematch request sent.");
  }

  if (!match || !session) {
    return (
      <div>
        <h1>Match</h1>
        <p className="stat-secondary">Loading...</p>
      </div>
    );
  }

  const isPlayer = session.user.id === match.player_a || session.user.id === match.player_b;
  const isPlayerA = session.user.id === match.player_a;
  const myName = names[session.user.id] ?? "You";
  const oppId = isPlayerA ? match.player_b : match.player_a;
  const oppName = names[oppId] ?? "Opponent";
  const myScore = isPlayerA ? match.score_a : match.score_b;
  const oppScore = isPlayerA ? match.score_b : match.score_a;

  const params = new URLSearchParams({
    tableId: match.id,
    websocketserver: RELAY_URL,
    ruletype: "sniperpool",
  });

  if (isPlayer) {
    params.set("userId", session.user.id);
    params.set("userName", myName);
    params.set("opponent.userId", oppId);
    params.set("opponent.userName", oppName);
    if (isPlayerA) params.set("first", "");
  } else {
    params.set("userId", session.user.id);
    params.set("userName", "Spectator");
    params.set("spectator", "");
  }

  const embedUrl = `${ENGINE_BASE_URL}/index.html?${params.toString()}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/matches" className="stat-secondary">← Back</Link>
        <div className="stat-secondary">🪙{(match.stake_cents / 100).toFixed(2)}</div>
      </div>

      <h1 style={{ fontSize: 20 }}>
        {isPlayer
          ? `vs ${oppName}`
          : `${names[match.player_a] ?? "Player"} vs ${names[match.player_b] ?? "Player"}`}
      </h1>

      {match.status === "in_progress" && (
        <p className="stat-secondary">
          Round {match.current_round}/{match.rounds} — score {myScore}-{oppScore}
        </p>
      )}

      <iframe
        src={embedUrl}
        title="Billiards match"
        style={{ width: "100%", height: "72vh", border: "1px solid var(--border)", borderRadius: 12 }}
        allow="fullscreen; autoplay"
      />

      {message && <p role="alert" style={{ marginTop: 8 }}>{message}</p>}

      {isPlayer && match.status === "in_progress" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
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

      {isPlayer && match.status === "completed" && !alreadyRated && (
        <RatingForm
          match={{ id: match.id } as any}
          onDone={() => setAlreadyRated(true)}
        />
      )}
      {isPlayer && match.status === "completed" && alreadyRated && (
        <p className="stat-secondary">You rated this match.</p>
      )}

      {isPlayerA && match.status === "completed" && (
        <button type="button" disabled={busy} onClick={requestRematch} style={{ marginTop: 12 }}>
          Request rematch
        </button>
      )}
    </div>
  );
}
