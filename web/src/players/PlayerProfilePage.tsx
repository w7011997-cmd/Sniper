import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, XCircle, Crown, Star, TrendingUp } from "lucide-react";
import { usePlayerProfile } from "./usePlayerProfile";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Tab = "all" | "matches" | "reviews";

export default function PlayerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = usePlayerProfile(id);
  const [tab, setTab] = useState<Tab>("all");

  const ratingDisplay = p.ratingCount > 0 ? p.avgRating.toFixed(1) : "—";
  const rankDisplay = p.rank ? `${p.rank}${p.rank === 1 ? "st" : p.rank === 2 ? "nd" : p.rank === 3 ? "rd" : "th"}` : "—";

  if (p.notFound) {
    return (
      <div className="profile-page">
        <div className="profile-topbar">
          <button className="icon-circle-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ margin: 0 }}>Player</h2>
          <div style={{ width: 36 }} />
        </div>
        <p className="stat-secondary">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0 }}>{p.loading ? "..." : p.username}</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="profile-card">
        <div className="section-title"><TrendingUp size={14} /> Performance overview</div>
        <div className="stats-grid">
          <div className="stat-card" style={{ color: "#22c55e" }}>
            <Trophy size={18} />
            <div className="stat-card-label">Wins</div>
            <div className="stat-card-value" style={{ color: "#22c55e" }}>{p.wins}</div>
          </div>
          <div className="stat-card" style={{ color: "#ef4444" }}>
            <XCircle size={18} />
            <div className="stat-card-label">Losses</div>
            <div className="stat-card-value" style={{ color: "#ef4444" }}>{p.losses}</div>
          </div>
          <Link to="/rankings" style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ color: "var(--accent)" }}>
              <Crown size={18} />
              <div className="stat-card-label">Rank</div>
              <div className="stat-card-value" style={{ color: "var(--accent)" }}>{rankDisplay}</div>
            </div>
          </Link>
          <div className="stat-card">
            <Star size={18} />
            <div className="stat-card-label">Rating</div>
            <div className="stat-card-value">{ratingDisplay}</div>
          </div>
        </div>
        {p.ratingCount === 0 && (
          <p className="stat-secondary" style={{ textAlign: "center", marginTop: 8 }}>
            No ratings yet.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setTab(tab === "matches" ? "all" : "matches")}
          style={{
            flex: 1,
            background: tab === "matches" ? "var(--accent)" : "transparent",
            borderColor: tab === "matches" ? "var(--accent)" : "var(--border)",
            color: tab === "matches" ? "#fff" : "var(--text)",
          }}
        >
          Matches
        </button>
        <button
          type="button"
          onClick={() => setTab(tab === "reviews" ? "all" : "reviews")}
          style={{
            flex: 1,
            background: tab === "reviews" ? "var(--accent)" : "transparent",
            borderColor: tab === "reviews" ? "var(--accent)" : "var(--border)",
            color: tab === "reviews" ? "#fff" : "var(--text)",
          }}
        >
          Reviews
        </button>
      </div>

      {(tab === "all" || tab === "matches") && (
        <div className="profile-card">
          <div className="section-title"><TrendingUp size={14} /> Recent matches</div>
          {p.recentMatches.length === 0 && !p.loading && (
            <p className="stat-secondary">No completed matches yet.</p>
          )}
          {p.recentMatches.map((m, i) => (
            <div className="activity-item" key={i}>
              <div className={"activity-icon" + (m.won ? "" : " activity-icon-loss")}>
                {m.won ? <Trophy size={16} /> : <XCircle size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <div>
                  {m.won ? "Won" : "Lost"} vs{" "}
                  <Link to={`/players/${m.opponentId}`} style={{ color: "inherit" }}>
                    {m.opponentName}
                  </Link>{" "}
                  ({m.myScore}-{m.opponentScore})
                </div>
              </div>
              <div className="stat-secondary">{timeAgo(m.endedAt)}</div>
            </div>
          ))}
        </div>
      )}

      {(tab === "all" || tab === "reviews") && (
        <div className="profile-card">
          <div className="section-title"><Star size={14} /> Reviews</div>
          {p.reviews.length === 0 && (
            <p className="stat-secondary">No reviews yet.</p>
          )}
          {p.reviews.map((r, i) => (
            <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg key={n} width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 2 }}>
                      <path
                        d="M12 2.5l2.9 6.26 6.6.78-4.9 4.6 1.28 6.6L12 17.6l-5.88 3.14 1.28-6.6-4.9-4.6 6.6-.78z"
                        fill={n <= r.stars ? "var(--accent)" : "none"}
                        stroke={n <= r.stars ? "var(--accent)" : "var(--border)"}
                        strokeWidth="1.5"
                      />
                    </svg>
                  ))}
                </div>
                <span className="stat-secondary">{timeAgo(r.createdAt)}</span>
              </div>
              {r.comment && <p style={{ margin: "6px 0 4px", fontStyle: "italic" }}>"{r.comment}"</p>}
              <div className="stat-secondary">
                —{" "}
                <Link to={`/players/${r.raterId}`} style={{ color: "inherit" }}>
                  {r.raterName}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
