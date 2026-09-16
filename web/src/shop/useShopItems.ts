import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../shared/supabaseClient";

export type ShopCategory = "cue" | "cue_trail" | "table";

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string | null;
  price_usd_cents: number;
}

export function useShopItems() {
  const { session } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const uid = session?.user.id;

    const [{ data: shopItems }, { data: purchases }, { data: equippedRows }] = await Promise.all([
      supabase
        .from("shop_items")
        .select("id, category, name, description, price_usd_cents")
        .eq("active", true)
        .order("price_usd_cents", { ascending: true }),
      uid
        ? supabase.from("purchases").select("item_id, status").eq("user_id", uid)
        : Promise.resolve({ data: [] as { item_id: string; status: string }[] }),
      uid
        ? supabase.from("user_equipped_items").select("category, item_id").eq("user_id", uid)
        : Promise.resolve({ data: [] as { category: string; item_id: string }[] }),
    ]);

    setItems((shopItems as ShopItem[]) ?? []);
    setOwnedIds(new Set((purchases ?? []).filter((p) => p.status === "completed").map((p) => p.item_id)));
    setPendingIds(new Set((purchases ?? []).filter((p) => p.status === "pending").map((p) => p.item_id)));
    const eq: Record<string, string> = {};
    (equippedRows ?? []).forEach((e) => (eq[e.category] = e.item_id));
    setEquipped(eq);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session?.user.id]);

  return { items, ownedIds, pendingIds, equipped, loading, refresh: load };
}
