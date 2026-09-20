import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft, ShoppingBag, Lock, Check, Loader2, X } from "lucide-react";
import { supabase } from "../shared/supabaseClient";
import { useShopItems, type ShopCategory, type ShopItem } from "./useShopItems";
import "../profile/profile.css";
import "./shop.css";

const TABS: { key: ShopCategory; label: string }[] = [
  { key: "cue", label: "Cues" },
  { key: "cue_trail", label: "Cue Trails" },
  { key: "table", label: "Tables" },
];

const CURRENCIES = ["USD", "NGN", "GBP", "EUR", "GHS", "KES", "ZAR"];
const CURRENCY_TIP_KEY = "sniper_shop_currency_tip_count";

export default function ShopPage() {
  const navigate = useNavigate();
  const { items, ownedIds, pendingIds, equipped, loading, refresh } = useShopItems();
  const [tab, setTab] = useState<ShopCategory>("cue");
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCurrencyTip, setShowCurrencyTip] = useState(false);
  const [confirmItem, setConfirmItem] = useState<
    { item: ShopItem; durationMonths: number | null } | null
  >(null);

  useEffect(() => {
    const seen = Number(localStorage.getItem(CURRENCY_TIP_KEY) ?? "0");
    if (seen < 2) {
      setShowCurrencyTip(true);
      localStorage.setItem(CURRENCY_TIP_KEY, String(seen + 1));
    }
  }, []);

  useEffect(() => {
    if (currency === "USD") {
      setRate(1);
      return;
    }
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => setRate(data?.rates?.[currency] ?? 1))
      .catch(() => setRate(1));
  }, [currency]);

  const SUBSCRIPTION_MULTIPLIER: Record<number, number> = { 1: 1, 2: 1.8, 3: 2.5 };

  function formatAmountCents(cents: number) {
    const amount = (cents / 100) * rate;
    const symbol = currency === "USD" ? "$" : currency === "NGN" ? "₦" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "";
    return symbol ? `${symbol}${amount.toFixed(2)}` : `${amount.toFixed(2)} ${currency}`;
  }

  function formatPrice(item: ShopItem) {
    return formatAmountCents(item.price_usd_cents);
  }

  function formatSubscriptionPrice(item: ShopItem, months: number) {
    return formatAmountCents(Math.round(item.price_usd_cents * SUBSCRIPTION_MULTIPLIER[months]));
  }

  async function buy(item: ShopItem, durationMonths: number | null = null) {
    setBusyId(item.id);
    setMessage(null);

    const { data, error } = await supabase.functions.invoke("initialize-purchase", {
      body: { item_id: item.id, currency, duration_months: durationMonths },
    });

    setBusyId(null);

    if (error || data?.error) {
      setMessage(data?.error ?? error?.message ?? "Could not start payment.");
      return;
    }
    if (data?.stub) {
      setMessage(data.message);
      return;
    }

    const url = data.authorization_url as string;
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, "_blank");
    }
  }

  async function equip(item: ShopItem) {
    setBusyId(item.id);
    setMessage(null);
    const { error } = await supabase.rpc("equip_item", { p_item_id: item.id });
    setBusyId(null);
    setMessage(error ? error.message : null);
    if (!error) refresh();
  }

  const visibleItems = items.filter((i) => i.category === tab);

  return (
    <div className="profile-page">
      <div className="profile-topbar" style={{ position: "relative" }}>
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingBag size={18} /> Shop
        </h2>
        <select
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            setShowCurrencyTip(false);
          }}
          className="shop-currency-select"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {showCurrencyTip && (
          <div className="shop-currency-tip">
            <button
              type="button"
              className="shop-currency-tip-close"
              onClick={() => setShowCurrencyTip(false)}
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
            Tap here to change your currency
          </div>
        )}
      </div>

      <div className="shop-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={"shop-tab" + (tab === t.key ? " shop-tab-active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p role="alert" style={{ margin: "8px 0" }}>{message}</p>}

      {loading && <p className="stat-secondary">Loading...</p>}

      <div className="shop-grid">
        {visibleItems.map((item) => {
          const owned = ownedIds.has(item.id);
          const pending = pendingIds.has(item.id);
          const isEquipped = equipped[item.category] === item.id;
          const busy = busyId === item.id;

          return (
            <div key={item.id} className="shop-item-card">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="shop-item-image" />
              ) : (
                <div className="shop-item-image shop-item-image-placeholder" />
              )}
              <div className="shop-item-name">{item.name}</div>
              {item.description && <div className="stat-secondary">{item.description}</div>}
              <div className="shop-item-footer">
                {!owned && item.category === "cue_trail" && (
                  <div className="shop-trail-tiers">
                    {[1, 2, 3].map((months) => (
                      <button
                        key={months}
                        type="button"
                        className="shop-trail-tier-btn"
                        disabled={busy || pending}
                        onClick={() => setConfirmItem({ item, durationMonths: months })}
                      >
                        {months}mo - {formatSubscriptionPrice(item, months)}
                      </button>
                    ))}
                  </div>
                )}
                {!owned && item.category !== "cue_trail" && (
                  <>
                    <div className="shop-item-price">{formatPrice(item)}</div>
                    <button
                      type="button"
                      disabled={busy || pending}
                      onClick={() => setConfirmItem({ item, durationMonths: null })}
                    >
                      {busy ? <Loader2 size={14} className="shop-spin" /> : pending ? "Pending..." : <><Lock size={14} /> Buy</>}
                    </button>
                  </>
                )}
                {owned && isEquipped && (
                  <div className="shop-equipped-badge">
                    <Check size={14} /> Equipped
                  </div>
                )}
                {owned && !isEquipped && (
                  <button type="button" disabled={busy} onClick={() => equip(item)}>
                    {busy ? <Loader2 size={14} className="shop-spin" /> : "Equip"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!loading && visibleItems.length === 0 && (
          <p className="stat-secondary">Nothing here yet.</p>
        )}
      </div>

      {confirmItem && (
        <div className="shop-buy-confirm-overlay" onClick={() => setConfirmItem(null)}>
          <div className="shop-buy-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>
              If you aren't in Nigeria, you can pay using the "Card" option at checkout.
            </p>
            <div className="shop-buy-confirm-actions">
              <button type="button" onClick={() => setConfirmItem(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const c = confirmItem;
                  setConfirmItem(null);
                  buy(c.item, c.durationMonths);
                }}
              >
                Ok, continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
