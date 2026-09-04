import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Coins as CoinsIcon, Gift } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../shared/supabaseClient";
import { useWallet } from "./useWallet";
import WalletWarningBanner from "../shared/WalletWarningBanner";
import "../profile/profile.css";
import "./wallet.css";

const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR"];
const GIFT_CARD_BRANDS = ["Amazon", "Google Play", "Steam", "iTunes"];

export default function WalletPage() {
  const { balanceCents } = useWallet();

  const [fundAmount, setFundAmount] = useState("");
  const [fundCurrency, setFundCurrency] = useState("NGN");
  const [funding, setFunding] = useState(false);
  const [fundMessage, setFundMessage] = useState<string | null>(null);

  const [withdrawCoins, setWithdrawCoins] = useState("");
  const [withdrawBrand, setWithdrawBrand] = useState(GIFT_CARD_BRANDS[0]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  async function handleFund() {
    const value = Number(fundAmount);
    if (!value || value <= 0) {
      setFundMessage("Enter a valid amount.");
      return;
    }

    setFunding(true);
    setFundMessage(null);

    const { data, error } = await supabase.functions.invoke("initialize-topup", {
      body: { amount: value, currency: fundCurrency },
    });

    setFunding(false);

    if (error || data?.error) {
      setFundMessage(data?.error ?? error?.message ?? "Could not start payment.");
      return;
    }

    if (data?.stub) {
      setFundMessage(data.message);
      return;
    }

    const url = data.authorization_url as string;
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
  }

  async function handleWithdraw() {
    const value = Number(withdrawCoins);
    if (!value || value <= 0) {
      setWithdrawMessage("Enter a valid coin amount.");
      return;
    }

    setWithdrawing(true);
    setWithdrawMessage(null);

    const { error } = await supabase.rpc("request_withdrawal", {
      p_coins_cents: Math.round(value * 100),
      p_gift_card_brand: withdrawBrand,
    });

    setWithdrawing(false);
    setWithdrawMessage(
      error ? error.message : "Withdrawal requested — you'll get your gift card code once it's processed."
    );
    if (!error) setWithdrawCoins("");
  }

  return (
    <div className="profile2">
      <div className="wallet-header">
        <Link to="/profile" className="wallet-back-btn">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="wallet-title">Wallet</h1>
        <div style={{ width: 40 }} />
      </div>

      <div className="p2-card wallet-balance-card">
        <div className="p2-stat-label">Balance</div>
        <div className="wallet-balance-value">
          <span className="wallet-coin-emoji">🪙</span>
          <span className="p2-green">
            {balanceCents !== null ? (balanceCents / 100).toFixed(2) : "..."}
          </span>
        </div>
      </div>

      <WalletWarningBanner />

      <div className="p2-card">
        <div className="p2-section-title">
          <CoinsIcon size={16} />
          Fund Wallet
        </div>

        <div className="wallet-input-row">
          <input
            type="number"
            placeholder="Amount"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
          />
          <select value={fundCurrency} onChange={(e) => setFundCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {fundMessage && <p role="alert">{fundMessage}</p>}

        <button type="button" disabled={funding} onClick={handleFund}>
          {funding ? "Starting..." : "Fund Wallet"}
        </button>
      </div>

      <div className="p2-card">
        <div className="p2-section-title">
          <Gift size={16} />
          Withdraw
        </div>

        <div className="wallet-input-row">
          <input
            type="number"
            placeholder="Amount in coins"
            value={withdrawCoins}
            onChange={(e) => setWithdrawCoins(e.target.value)}
          />
          <select value={withdrawBrand} onChange={(e) => setWithdrawBrand(e.target.value)}>
            {GIFT_CARD_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {withdrawMessage && <p role="alert">{withdrawMessage}</p>}

        <button type="button" disabled={withdrawing} onClick={handleWithdraw}>
          {withdrawing ? "Requesting..." : "Request withdrawal"}
        </button>
      </div>
    </div>
  );
}
