import { useParams, useNavigate } from "react-router-dom";
import { usePlayerProfile } from "./usePlayerProfile";

export default function PlayerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = usePlayerProfile(id);

  const played = p.wins + p.losses;
  const winRate = played > 0 ? Math.round((p.wins / played) * 100) : 0;
  const ratingDisplay = p.ratingCount > 0 ? p.avgRating.toFixed(1) : "—";

  if (p.notFound) {
    return (
      <div className="profile-page">
        <div className="profile-topbar">
          <button className="icon-circle-btn" onClick={() => navigate(-1)}>‹</button>
          <h2 style={{ margin: 0 }}>PLAYER</h2>
          <div style={{ width: 36 }} />
        </div>
        <p className="stat-secondary">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>‹</button>
        <h2 style={{ margin: 0 }}>{p.loading ? "..." : p.username.toUpperCase()}</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="profile-card">
        <div className="section-title">📈 PERFORMANCE OVERVIEW</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div>🏆</div>
            <div className="stat-card-label">WINS</div>
            <div className="stat-card-value" style={{ color: "#22c55e" }}>{p.wins}</div>
          </div>
          <div className="stat-card">
            <div>❌</div>
            <div className="stat-card-label">LOSSES</div>
            <div className="stat-card-value" style={{ color: "#ef4444" }}>{p.losses}</div>
          </div>
          <div className="stat-card">
            <div>🎯</div>
            <div className="stat-card-label">WIN RATE</div>
            <div className="stat-card-value" style={{ color: "var(--accent)" }}>{winRate}%</div>
          </div>
          <div className="stat-card">
            <div>⭐</div>
            <div className="stat-card-label">RATING</div>
            <div className="stat-card-value">{ratingDisplay}</div>
          </div>
        </div>
        {p.ratingCount === 0 && (
          <p className="stat-secondary" style={{ textAlign: "center", marginTop: 8 }}>
            No ratings yet.
          </p>
        )}
      </div>

      <div className="profile-card">
        <div className="section-title">🕐 RECENT MATCHES</div>
        {p.recentMatches.length === 0 && !p.loading && (
          <p className="stat-secondary">No completed matches yet.</p>
        )}
        {p.recentMatches.map((m, i) => (
          <div className="activity-item" key={i}>
            <div>{m.won ? "🏆" : "❌"}</div>
            <div style={{ flex: 1 }}>
              <div>{m.won ? "Won" : "Lost"} vs {m.opponentName}</div>
              <div className="stat-secondary">₦{(m.stakeCents / 100).toFixed(2)} stake</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
