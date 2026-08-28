import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";
import { useWallet } from "./useWallet";

interface Withdrawal {
  id: string;
  coins_cents: number;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { balanceCents, refresh } = useWallet();
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  async function loadWithdrawals() {
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("id, coins_cents, status, created_at")
      .eq("user_id", session?.user.id ?? "")
      .order("created_at", { ascending: false })
      .limit(10);
    setWithdrawals(data ?? []);
  }

  useEffect(() => {
    loadWithdrawals();
  }, [session?.user.id]);

  async function handleFund() {
    const coins = Number(fundAmount);
    if (!fundAmount || isNaN(coins) || coins <= 0) return;

    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke("initialize-topup", {
      body: { coins_cents: Math.round(coins * 100) },
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
    } else if (data?.stub) {
      setMessage(data.message);
    } else if (data?.authorization_url) {
      window.location.href = data.authorization_url;
    }
  }

  async function handleWithdraw() {
    const coins = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(coins) || coins <= 0) return;

    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc("request_withdrawal", {
      p_coins_cents: Math.round(coins * 100),
    });
    setBusy(false);
    setMessage(error ? error.message : "Withdrawal requested — you'll be notified once it's processed.");
    setWithdrawAmount("");
    refresh();
    loadWithdrawals();
  }

  async function handleCancel(id: string) {
    const { error } = await supabase.rpc("cancel_withdrawal", { p_request_id: id });
    setMessage(error ? error.message : "Withdrawal cancelled — coins returned to your wallet.");
    refresh();
    loadWithdrawals();
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>‹</button>
        <h2 style={{ margin: 0 }}>WALLET</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="profile-card" style={{ textAlign: "center" }}>
        <div className="stat-secondary">BALANCE</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#22c55e" }}>
          🪙{balanceCents !== null ? (balanceCents / 100).toFixed(2) : "..."}
        </div>
      </div>

      {message && <p role="alert">{message}</p>}

      <div className="profile-card">
        <div className="section-title">🪙 FUND WALLET</div>
        <input
          type="number"
          placeholder="Amount in ₦"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="button" disabled={busy} onClick={handleFund} style={{ width: "100%" }}>
          Fund with Paystack
        </button>
      </div>

      <div className="profile-card">
        <div className="section-title">💸 WITHDRAW</div>
        <input
          type="number"
          placeholder="Amount in coins"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="button" disabled={busy} onClick={handleWithdraw} style={{ width: "100%" }}>
          Request withdrawal
        </button>

        {withdrawals.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {withdrawals.map((w) => (
              <div className="activity-item" key={w.id}>
                <div>💸</div>
                <div style={{ flex: 1 }}>
                  <div>🪙{(w.coins_cents / 100).toFixed(2)}</div>
                  <div className="stat-secondary">{w.status}</div>
                </div>
                {w.status === "pending" && (
                  <button type="button" onClick={() => handleCancel(w.id)}>
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
