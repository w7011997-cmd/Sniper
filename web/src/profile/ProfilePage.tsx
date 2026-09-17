import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Settings,
  User,
  Mail,
  Wallet,
  Trophy,
  XCircle,
  Crown,
  Star,
  History,
  ShoppingBag,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../shared/supabaseClient";
import { usePushRegistration } from "../push/usePushRegistration";
import { useProfileData, type ActivityKind } from "./useProfileData";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="stat-card" style={{ color }}>
      {icon}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  if (kind === "win") return <div className="activity-icon"><Trophy size={16} /></div>;
  if (kind === "loss") return <div className="activity-icon activity-icon-loss"><XCircle size={16} /></div>;
  if (kind === "wallet") return <div className="activity-icon"><Wallet size={16} /></div>;
  return <div className="activity-icon"><User size={16} /></div>;
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
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <button className="icon-circle-btn">
          <Settings size={16} />
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-row">
          <div className="profile-row-icon"><User size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">Username</div>
            <div className="profile-row-value">{p.loading ? "..." : p.username}</div>
          </div>
          <div className="chevron">›</div>
        </div>
        <div className="profile-row">
          <div className="profile-row-icon"><Mail size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">Email</div>
            <div className="profile-row-value">{p.email}</div>
          </div>
          <div className="chevron">›</div>
        </div>
        <Link to="/wallet" className="profile-row" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="profile-row-icon"><Wallet size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="stat-secondary">Wallet balance</div>
            <div className="profile-row-value" style={{ color: "#22c55e" }}>
              {p.balanceCents !== null ? `₦${(p.balanceCents / 100).toFixed(2)}` : "..."}
            </div>
          </div>
          <div className="chevron">›</div>
        </Link>
      </div>

      <div className="profile-card">
        <div className="section-title"><TrendingUp size={14} /> Performance overview</div>
        <div className="stats-grid">
          <StatCard icon={<Trophy size={18} />} label="Wins" value={String(p.wins)} color="#22c55e" />
          <StatCard icon={<XCircle size={18} />} label="Losses" value={String(p.losses)} color="#ef4444" />
          <Link to="/rankings" style={{ textDecoration: "none" }}>
            <StatCard icon={<Crown size={18} />} label="Rank" value={rankDisplay} color="var(--accent)" />
          </Link>
          <StatCard icon={<Star size={18} />} label="Rating" value={ratingDisplay} color="var(--text)" />
        </div>
        {p.ratingCount === 0 && (
          <p className="stat-secondary" style={{ textAlign: "center", marginTop: 8 }}>
            No ratings yet. Play matches to build your rating!
          </p>
        )}
      </div>

      <div className="quicklinks-row">
        <Link to="/shop" className="quick-link" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="quick-link-badge">Visit here</span>
          <div className="quick-link-icon"><ShoppingBag size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="quick-link-title">Shop</div>
            <div className="stat-secondary">Cues, trails & tables</div>
          </div>
        </Link>
        <Link to="/matches/history" className="quick-link" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="quick-link-icon"><History size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="quick-link-title">Match history</div>
            <div className="stat-secondary">Past matches</div>
          </div>
        </Link>
      </div>

      <div className="profile-card">
        <div className="section-title"><TrendingUp size={14} /> Recent activity</div>
        {p.activity.length === 0 && !p.loading && (
          <div className="activity-item">
            <div className="activity-icon"><Trophy size={16} /></div>
            <div style={{ flex: 1 }}>
              <div>No matches yet</div>
              <div className="stat-secondary">Play your first match</div>
            </div>
          </div>
        )}
        {p.activity.slice(0, 4).map((a, i) => (
          <div className="activity-item" key={i}>
            <ActivityIcon kind={a.kind} />
            <div style={{ flex: 1 }}>
              <div>{a.label}</div>
              <div className="stat-secondary">{a.sub}</div>
            </div>
            <div className="stat-secondary">{a.time}</div>
          </div>
        ))}
      </div>

      <div className="profile-card">
        <div className="section-title"><Star size={14} /> Reviews</div>
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
                      fill={n <= r.stars ? "var(--accent)" : "none"}
                      stroke={n <= r.stars ? "var(--accent)" : "var(--border)"}
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
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
