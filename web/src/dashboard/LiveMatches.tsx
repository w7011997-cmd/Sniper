import { Link } from "react-router-dom";
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

function MatchCard({ match }: { match: LiveMatch }) {
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
        Stake: 🪙{(match.stake_cents / 100).toFixed(2)} each
      </p>
      <Link
        to={`/match/${match.id}`}
        style={{
          display: "block",
          textAlign: "center",
          marginTop: 8,
          padding: "10px 0",
          borderRadius: 8,
          border: "1px solid var(--accent)",
          color: "var(--accent)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Watch
      </Link>
    </div>
  );
}

export default function LiveMatches() {
  const { matches, loading } = useLiveMatches();

  return (
    <div>
      <h1>Live Matches</h1>
      {loading && <p className="stat-secondary">Loading...</p>}
      {!loading && matches.length === 0 && (
        <p className="stat-secondary">No live matches right now — accept a challenge to start one.</p>
      )}
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
