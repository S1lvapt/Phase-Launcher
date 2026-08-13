import { useEffect, useState } from "react";
import { ShopItem } from "../vite-env";
import { api } from "../lib/api";
import { getCosmetic } from "../lib/cosmetics";

export function useShopItems() {
  const [featured, setFeatured] = useState<ShopItem[]>([]);
  const [daily, setDaily] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiration, setExpiration] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.getShopCatalog();

        if (!res.success || !res.data) {
          return;
        }

        const json = res.data;

        if (json.expiration) {
          setExpiration(json.expiration);
        }

        const dailyEntries: any[] =
          json.storefronts?.find((s: any) => s.name === "BRDailyStorefront")
            ?.catalogEntries ?? [];

        const featuredEntries: any[] =
          json.storefronts?.find((s: any) => s.name === "BRWeeklyStorefront")
            ?.catalogEntries ?? [];

        const loadItems = async (entries: any[]): Promise<ShopItem[]> => {
          const items: ShopItem[] = [];
          const seen = new Set<string>();

          for (const entry of entries) {
            const templateId: string | undefined =
              entry.itemGrants?.[0]?.templateId;
            if (!templateId) continue;

            const id = templateId.split(":")[1];
            if (!id || seen.has(id)) continue;
            seen.add(id);

            const price: number = entry.prices?.[0]?.finalPrice ?? 0;

            const data = await getCosmetic(id);
            if (cancelled) return items;
            if (data.status !== 200) continue;

            items.push({
              id: data.data.id,
              name: data.data.name,
              description: data.data.description,
              price,
              images: data.data.images,
              rarity: data.data.rarity,
            });
          }

          return items;
        };

        const [featuredItems, dailyItems] = await Promise.all([
          loadItems(featuredEntries),
          loadItems(dailyEntries),
        ]);

        if (!cancelled) {
          setFeatured(featuredItems);
          setDaily(dailyItems);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { featured, daily, loading, expiration };
}
