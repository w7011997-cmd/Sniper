import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { usePushRegistration } from "../push/usePushRegistration";
import { useWallet } from "../wallet/useWallet";
import "./profile.css";

interface Stats {
  username: string;
  avg_rating: number;
  rating_count: number;
  wins: number;
  losses: number;
}

export default function ProfilePage() {
  const { session } = useAuth();
  usePushRegistration();
  const { balanceCents } = useWallet();
  const [stats, setStats] = useState<Stats | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("player_stats")
      .select("username, avg_rating, rating_count, wins, losses")
      .eq("player_id", session.user.id)
      .single()
      .then(({ data }) => setStats(data));
  }, [session]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
  }

  return (
    <div className="term">
      <div className="term-titlebar">
        <span className="term-dot term-dot-red" />
        <span className="term-dot term-dot-yellow" />
        <span className="term-dot term-dot-green" />
        <span className="term-titletext">profile@sniper</span>
      </div>

      <div className="term-body">
        <div className="term-line">
          <span className="term-prompt">$</span> whoami
        </div>
        <div className="term-value">{stats?.username ?? "loading..."}</div>

        <div className="term-line">
          <span className="term-prompt">$</span> cat session.email
        </div>
        <div className="term-value">{session?.user.email}</div>

        <div className="term-line">
          <span className="term-prompt">$</span> wallet --balance
        </div>
        <div className="term-value term-accent-green">
          ₦{balanceCents !== null ? (balanceCents / 100).toFixed(2) : "..."}
        </div>

        <div className="term-line">
          <span className="term-prompt">$</span> stats --show
        </div>
        <div className="term-value">
          {stats ? (
            <>
              wins: <span className="term-accent-purple">{stats.wins}</span>{"  "}
              losses: <span className="term-accent-purple">{stats.losses}</span>
              <br />
              rating:{" "}
              {stats.rating_count > 0
                ? `${stats.avg_rating.toFixed(1)} ★ (${stats.rating_count})`
                : "no ratings yet"}
            </>
          ) : (
            "loading..."
          )}
        </div>

        <div className="term-line">
          <span className="term-prompt">$</span>{" "}
          <button className="term-btn" disabled={signingOut} onClick={handleSignOut}>
            sign_out {signingOut ? "..." : ""}
          </button>
        </div>

        <div className="term-cursor-line">
          <span className="term-prompt">$</span> <span className="term-cursor" />
        </div>
      </div>
    </div>
  );
}
