import { useNavigate } from "react-router-dom";
import MyMatches from "./MyMatches";

export default function MatchHistoryPage() {
  const navigate = useNavigate();
  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>‹</button>
        <h2 style={{ margin: 0 }}>MATCH HISTORY</h2>
        <div style={{ width: 36 }} />
      </div>
      <MyMatches />
    </div>
  );
}
