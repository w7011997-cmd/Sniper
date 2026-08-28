import { useNavigate } from "react-router-dom";
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

function QuickLink({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="quick-link">
      <div className="quick-link-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="quick-link-title">{title}</div>
        <div className="stat-secondary">{sub}</div>
      </div>
      <div className="chevron">›</div>
    </div>
  );
}

export default function ProfilePage() {
  usePushRegistration();
  const navigate = useNavigate();
  const p = useProfileData();

  const played = p.wins + p.losses;
  const winRate = played > 0 ? Math.round((p.wins / played) * 100) : 0;
  const ratingDisplay = p.ratingCount > 0 ? p.avgRating.toFixed(1) : "—";

  const achievements = [
    { icon: "🏅", title: "First Match", sub: "Play your first match", progress: Math.min(played, 1), goal: 1 },
    { icon: "🎖️", title: "Rookie", sub: "Win 5 matches", progress: Math.min(p.wins, 5), goal: 5 },
    { icon: "🔥", title: "Cold Streak", sub: "Win 3 matches in a row", progress: Math.min(p.winStreak, 3), goal: 3 },
  ];

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
        <div className="profile-row">
          <div className="profile-row-icon">👛</div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">WALLET BALANCE</div>
            <div className="profile-row-value" style={{ color: "#22c55e" }}>
              ₦{p.balanceCents !== null ? (p.balanceCents / 100).toFixed(2) : "..."}
            </div>
          </div>
          <div className="chevron">›</div>
        </div>
      </div>

      <div className="profile-card">
        <div className="section-title">📈 PERFORMANCE OVERVIEW</div>
        <div className="stats-grid">
          <StatCard icon="🏆" label="WINS" value={String(p.wins)} color="#22c55e" />
          <StatCard icon="❌" label="LOSSES" value={String(p.losses)} color="#ef4444" />
          <StatCard icon="🎯" label="WIN RATE" value={`${winRate}%`} color="var(--accent)" />
          <StatCard icon="⭐" label="RATING" value={ratingDisplay} />
        </div>
        {p.ratingCount === 0 && (
          <p className="stat-secondary" style={{ textAlign: "center", marginTop: 8 }}>
            No ratings yet. Play matches to build your rating!
          </p>
        )}
      </div>

      <div className="quicklinks-row">
        <QuickLink icon="🕐" title="Match History" sub="View your past matches" />
        <QuickLink icon="🛡️" title="Achievements" sub="Unlock and track badges" />
        <QuickLink icon="📊" title="Statistics" sub="Detailed performance" />
      </div>

      <div className="activity-columns">
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
          <div className="section-title">🎖️ ACHIEVEMENTS</div>
          {achievements.map((a, i) => (
            <div className="activity-item" key={i}>
              <div>{a.progress >= a.goal ? a.icon : "🔒"}</div>
              <div style={{ flex: 1 }}>
                <div>{a.title}</div>
                <div className="stat-secondary">{a.sub}</div>
              </div>
              <div className="stat-secondary">
                {a.progress}/{a.goal}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="signout-btn" onClick={() => supabase.auth.signOut()}>
        ⏻ SIGN OUT
      </button>
    </div>
  );
}
