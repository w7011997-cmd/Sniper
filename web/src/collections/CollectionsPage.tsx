import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Layers, ShoppingBag, Check, Loader2 } from "lucide-react";
import { supabase } from "../shared/supabaseClient";
import { useShopItems, type ShopCategory, type ShopItem } from "../shop/useShopItems";
import { useState } from "react";
import "../profile/profile.css";
import "../shop/shop.css";
import "./collections.css";

const SECTIONS: { key: ShopCategory; label: string }[] = [
  { key: "cue", label: "Cues" },
  { key: "cue_trail", label: "Cue Trails" },
  { key: "table", label: "Tables" },
];

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { items, ownedIds, equipped, loading, refresh } = useShopItems();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const owned = items.filter((i) => ownedIds.has(i.id));

  async function use(item: ShopItem) {
    setBusyId(item.id);
    setMessage(null);
    const { error } = await supabase.rpc("equip_item", { p_item_id: item.id });
    setBusyId(null);
    setMessage(error ? error.message : null);
    if (!error) refresh();
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="icon-circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={18} /> My Collections
        </h2>
        <div style={{ width: 36 }} />
      </div>

      <Link to="/shop" className="collections-shop-cta">
        <ShoppingBag size={16} /> Visit Shop
      </Link>

      {message && <p role="alert" style={{ margin: "8px 0" }}>{message}</p>}
      {loading && <p className="stat-secondary">Loading...</p>}

      {!loading && owned.length === 0 && (
        <div className="profile-card" style={{ textAlign: "center" }}>
          <p className="stat-secondary">You don't own any cosmetics yet.</p>
          <Link to="/shop" className="collections-shop-cta" style={{ display: "inline-flex", marginTop: 8 }}>
            <ShoppingBag size={16} /> Browse the Shop
          </Link>
        </div>
      )}

      {SECTIONS.map((section) => {
        const sectionItems = owned.filter((i) => i.category === section.key);
        if (sectionItems.length === 0) return null;
        return (
          <div key={section.key} className="profile-card">
            <div className="section-title">{section.label}</div>
            <div className="shop-grid">
              {sectionItems.map((item) => {
                const isEquipped = equipped[item.category] === item.id;
                const busy = busyId === item.id;
                return (
                  <div key={item.id} className="shop-item-card">
                    <div className="shop-item-name">{item.name}</div>
                    {item.description && <div className="stat-secondary">{item.description}</div>}
                    <div className="shop-item-footer">
                      {isEquipped ? (
                        <div className="shop-equipped-badge">
                          <Check size={14} /> In Use
                        </div>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => use(item)}>
                          {busy ? <Loader2 size={14} className="shop-spin" /> : "Use"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
