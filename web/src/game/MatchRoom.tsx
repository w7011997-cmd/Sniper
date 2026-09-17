import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { RatingForm } from "../matches/MyMatches";

const ENGINE_BASE_URL = "https://w7011997-cmd.github.io/billiards";
const RELAY_URL = "wss://billiards-network.onrender.com";

interface MatchRow {
  id: string;
  status: string;
  player_a: string;
  player_b: string;
  winner_id: string | null;
  rounds: number;
  score_a: number;
  score_b: number;
  current_round: number;
}

interface CueConfig {
  shaftColour?: string;
  buttColour?: string;
  jointColour?: string;
  ferruleColour?: string;
  grain?: boolean;
}

interface Cosmetics {
  ownCue: CueConfig | null;
  opponentCue: CueConfig | null;
  tableClothColour: string | null;
}

async function fetchEquippedConfig(userId: string, category: string): Promise<Record<string, unknown> | null> {
  const { data: equipped } = await supabase
    .from("user_equipped_items")
    .select("item_id")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle();
  if (!equipped) return null;

  const { data: item } = await supabase
    .from("shop_items")
    .select("config")
    .eq("id", equipped.item_id)
    .maybeSingle();
  return (item?.config as Record<string, unknown>) ?? null;
}

export default function MatchRoom() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [localGameOver, setLocalGameOver] = useState(false);
  const [cosmetics, setCosmetics] = useState<Cosmetics>({
    ownCue: null,
    opponentCue: null,
    tableClothColour: null,
  });

  async function load() {
    if (!id || !session) return;
    const { data: m } = await supabase
      .from("matches")
      .select(
        "id, status, player_a, player_b, winner_id, rounds, score_a, score_b, current_round"
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

    // Equipped cosmetics are purely visual and loaded once per match: your
    // own cue + table felt always, and your opponent's cue only when you're
    // actually one of the two players (the engine has no "opponent" concept
    // for a spectator).
    const isPlayerNow = session.user.id === m.player_a || session.user.id === m.player_b;
    const oppIdNow = session.user.id === m.player_a ? m.player_b : m.player_a;

    const [ownCue, tableConfig, opponentCue] = await Promise.all([
      fetchEquippedConfig(session.user.id, "cue"),
      fetchEquippedConfig(session.user.id, "table"),
      isPlayerNow ? fetchEquippedConfig(oppIdNow, "cue") : Promise.resolve(null),
    ]);

    setCosmetics({
      ownCue: (ownCue as CueConfig) ?? null,
      opponentCue: (opponentCue as CueConfig) ?? null,
      tableClothColour: (tableConfig?.clothColour as string) ?? null,
    });
  }

  useEffect(() => {
    setLocalGameOver(false);
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

    const { data, error } = await supabase.rpc("report_match_result", {
      p_match_id: match.id,
      p_winner: winnerId,
    });

    setBusy(false);
    setMessage(
      error
        ? error.message
        : data === "settled"
        ? "Match complete."
        : data === "disputed"
        ? "Your report doesn't match your opponent's — marked as disputed."
        : "Waiting on your opponent to confirm the result."
    );
    load();
  }

  useEffect(() => {
    function handleScoreMessage(event: MessageEvent) {
      if (event.data?.type !== "sniper-score-update") return;
      if (!id) return;
      supabase
        .rpc("update_match_score", {
          p_match_id: id,
          p_score_a: event.data.p1,
          p_score_b: event.data.p2,
        })
        .then(({ error }) => {
          if (!error) load();
        });
    }
    window.addEventListener("message", handleScoreMessage);
    return () => window.removeEventListener("message", handleScoreMessage);
  }, [id]);

  async function forfeit() {
    if (!match) return;
    if (!window.confirm("Forfeit this match? Your opponent will be recorded as the winner.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("forfeit_match", { p_match_id: match.id });
    setBusy(false);
    setMessage(error ? error.message : "Match forfeited.");
    load();
  }

  async function requestRematch() {
    if (!match) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_rematch", {
      p_match_id: match.id,
    });
    setBusy(false);
    setMessage(error ? error.message : "Rematch request sent.");
  }

  const matchRef = useRef(match);
  matchRef.current = match;
  const reportRoundRef = useRef(reportRound);
  reportRoundRef.current = reportRound;
  const reportedRoundRef = useRef<number | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "sniper-match-complete") return;
      setLocalGameOver(true);
      const m = matchRef.current;
      if (!m || !session) return;
      const isPlayerNow = session.user.id === m.player_a || session.user.id === m.player_b;
      if (!isPlayerNow) return;
      if (reportedRoundRef.current === m.current_round) return;
      reportedRoundRef.current = m.current_round;
      reportRoundRef.current(Boolean(event.data.amIWinner));
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [session]);

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

    if (cosmetics.ownCue) {
      Object.entries(cosmetics.ownCue).forEach(([k, v]) => {
        if (v !== undefined) params.set(`custom.cue.${k}`, String(v));
      });
    }
    if (cosmetics.opponentCue) {
      Object.entries(cosmetics.opponentCue).forEach(([k, v]) => {
        if (v !== undefined) params.set(`opponent.custom.cue.${k}`, String(v));
      });
    }
  } else {
    params.set("userId", session.user.id);
    params.set("userName", "Spectator");
    params.set("spectator", "");
  }

  if (cosmetics.tableClothColour) {
    params.set("custom.table.clothColour", cosmetics.tableClothColour);
  }

  const embedUrl = `${ENGINE_BASE_URL}/index.html?${params.toString()}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/matches" className="stat-secondary">← Back</Link>
      </div>

      <h1 style={{ fontSize: 20 }}>
        {isPlayer ? (
          <>
            vs <Link to={`/players/${oppId}`} style={{ color: "inherit" }}>{oppName}</Link>
          </>
        ) : (
          <>
            <Link to={`/players/${match.player_a}`} style={{ color: "inherit" }}>
              {names[match.player_a] ?? "Player"}
            </Link>{" "}
            vs{" "}
            <Link to={`/players/${match.player_b}`} style={{ color: "inherit" }}>
              {names[match.player_b] ?? "Player"}
            </Link>
          </>
        )}
      </h1>

      {match.status === "in_progress" && !localGameOver && (
        <p className="stat-secondary">
          Score: {myScore}-{oppScore}
        </p>
      )}

      <iframe
        src={embedUrl}
        title="Billiards match"
        style={{ width: "100%", height: "72vh", border: "1px solid var(--border)", borderRadius: 12 }}
        allow="fullscreen; autoplay"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />

      {message && <p role="alert" style={{ marginTop: 8 }}>{message}</p>}

      {isPlayer && match.status === "in_progress" && !localGameOver && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
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
