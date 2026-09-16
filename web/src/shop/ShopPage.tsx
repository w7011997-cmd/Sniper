import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { ChevronLeft, ShoppingBag, Lock, Check, Loader2 } from "lucide-react";
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

export default function ShopPage() {
  const navigate = useNavigate();
  const { items, ownedIds, pendingIds, equipped, loading, refresh } = useShopItems();
  const [tab, setTab] = useState<ShopCategory>("cue");
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  function formatPrice(item: ShopItem) {
    const amount = (item.price_usd_cents / 100) * rate;
    const symbol = currency === "USD" ? "$" : currency === "NGN" ? "₦" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "";
    return symbol ? `${symbol}${amount.toFixed(2)}` : `${amount.toFixed(2)} ${currency}`;
  }

  async function buy(item: ShopItem) {
    setBusyId(item.id);
    setMessage(null);

    const { data, error } = await supabase.functions.invoke("initialize-purchase", {
      body: { item_id: item.id, currency },
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
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingBag size={18} /> Shop
        </h2>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="shop-currency-select"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
              <div className="shop-item-name">{item.name}</div>
              {item.description && <div className="stat-secondary">{item.description}</div>}
              <div className="shop-item-footer">
                {!owned && (
                  <>
                    <div className="shop-item-price">{formatPrice(item)}</div>
                    <button type="button" disabled={busy || pending} onClick={() => buy(item)}>
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
    </div>
  );
}
