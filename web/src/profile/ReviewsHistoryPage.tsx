import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useReviewsHistory } from "./useReviewsHistory";

export default function ReviewsHistoryPage() {
  const navigate = useNavigate();
  const { reviews, loading } = useReviewsHistory();

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0 }}>Reviews</h2>
        <div style={{ width: 32 }} />
      </div>

      <div className="profile-card">
        {reviews.length === 0 && !loading && (
          <p className="stat-secondary">No reviews yet. Play matches to get rated!</p>
        )}
        {reviews.map((r, i) => (
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
    </div>
  );
}
