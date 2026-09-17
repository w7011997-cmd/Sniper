import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, XCircle, Wallet, User } from "lucide-react";
import { useActivityHistory } from "./useActivityHistory";
import type { ActivityKind } from "./useProfileData";

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  if (kind === "win") return <div className="activity-icon"><Trophy size={16} /></div>;
  if (kind === "loss") return <div className="activity-icon activity-icon-loss"><XCircle size={16} /></div>;
  if (kind === "wallet") return <div className="activity-icon"><Wallet size={16} /></div>;
  return <div className="activity-icon"><User size={16} /></div>;
}

export default function ActivityHistoryPage() {
  const navigate = useNavigate();
  const { activity, loading } = useActivityHistory();

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0 }}>Recent activity</h2>
        <div style={{ width: 32 }} />
      </div>

      <div className="profile-card">
        {activity.length === 0 && !loading && (
          <div className="activity-item">
            <div className="activity-icon"><Trophy size={16} /></div>
            <div style={{ flex: 1 }}>
              <div>No matches yet</div>
              <div className="stat-secondary">Play your first match</div>
            </div>
          </div>
        )}
        {activity.map((a, i) => (
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
    </div>
  );
}
