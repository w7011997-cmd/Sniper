import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../shared/supabaseClient";
import { usePushRegistration } from "../push/usePushRegistration";
import { useProfileData } from "./useProfileData";

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="stat-card">
      <div>{icon}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
    </div>
  );
}

export default function ProfilePage() {
  usePushRegistration();
  const navigate = useNavigate();
  const p = useProfileData();

  const ratingDisplay = p.ratingCount > 0 ? p.avgRating.toFixed(1) : "—";
  const rankDisplay = p.rank ? `${p.rank}${p.rank === 1 ? "st" : p.rank === 2 ? "nd" : p.rank === 3 ? "rd" : "th"}` : "—";

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>‹</button>
        <h2 style={{ margin: 0 }}>PROFILE</h2>
        <button className="icon-circle-btn">⚙️</button>
      </div>

      <div className="profile-card">
        <div className="profile-row">
          <div className="profile-row-icon">👤</div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">USERNAME</div>
            <div className="profile-row-value">{p.loading ? "..." : p.username}</div>
          </div>
          <div className="chevron">›</div>
        </div>
        <div className="profile-row">
          <div className="profile-row-icon">✉️</div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">EMAIL</div>
            <div className="profile-row-value">{p.email}</div>
          </div>
          <div className="chevron">›</div>
        </div>
        <Link to="/wallet" className="profile-row" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="profile-row-icon">👛</div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">WALLET BALANCE</div>
            <div className="profile-row-value" style={{ color: "#22c55e" }}>
              🪙{p.balanceCents !== null ? (p.balanceCents / 100).toFixed(2) : "..."}
            </div>
          </div>
          <div className="chevron">›</div>
        </Link>
      </div>

      <div className="profile-card">
        <div className="section-title">📈 PERFORMANCE OVERVIEW</div>
        <div className="stats-grid">
          <StatCard icon="🏆" label="WINS" value={String(p.wins)} color="#22c55e" />
          <StatCard icon="❌" label="LOSSES" value={String(p.losses)} color="#ef4444" />
          <Link to="/rankings" style={{ textDecoration: "none", color: "inherit" }}>
            <StatCard icon="👑" label="RANK" value={rankDisplay} color="var(--accent)" />
          </Link>
          <StatCard icon="⭐" label="RATING" value={ratingDisplay} />
        </div>
        {p.ratingCount === 0 && (
          <p className="stat-secondary" style={{ textAlign: "center", marginTop: 8 }}>
            No ratings yet. Play matches to build your rating!
          </p>
        )}
      </div>

      <Link to="/matches" className="quick-link" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="quick-link-icon">🕐</div>
        <div style={{ flex: 1 }}>
          <div className="quick-link-title">Match History</div>
          <div className="stat-secondary">View your past matches</div>
        </div>
        <div className="chevron">›</div>
      </Link>

      <div className="profile-card">
        <div className="section-title">📉 RECENT ACTIVITY</div>
        {p.activity.length === 0 && !p.loading && (
          <div className="activity-item">
            <div>🏆</div>
            <div style={{ flex: 1 }}>
              <div>No matches yet</div>
              <div className="stat-secondary">Play your first match</div>
            </div>
          </div>
        )}
        {p.activity.slice(0, 4).map((a, i) => (
          <div className="activity-item" key={i}>
            <div>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div>{a.label}</div>
              <div className="stat-secondary">{a.sub}</div>
            </div>
            <div className="stat-secondary">{a.time}</div>
          </div>
        ))}
      </div>

      <div className="profile-card">
        <div className="section-title">⭐ REVIEWS</div>
        {p.reviews.length === 0 && (
          <p className="stat-secondary">No reviews yet. Play matches to get rated!</p>
        )}
        {p.reviews.map((r, i) => (
          <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <svg key={n} width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 2 }}>
                    <path
                      d="M12 2.5l2.9 6.26 6.6.78-4.9 4.6 1.28 6.6L12 17.6l-5.88 3.14 1.28-6.6-4.9-4.6 6.6-.78z"
                      fill={n <= r.stars ? "#fbbf24" : "none"}
                      stroke={n <= r.stars ? "#fbbf24" : "var(--border)"}
                      strokeWidth="1.5"
                    />
                  </svg>
                ))}
              </div>
              <span className="stat-secondary">{r.time}</span>
            </div>
            {r.comment && <p style={{ margin: "6px 0 4px", fontStyle: "italic" }}>"{r.comment}"</p>}
            <div className="stat-secondary">— {r.raterName}</div>
          </div>
        ))}
      </div>

      <button className="signout-btn" onClick={() => supabase.auth.signOut()}>
        ⏻ SIGN OUT
      </button>
    </div>
  );
}
