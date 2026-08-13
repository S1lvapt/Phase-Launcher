"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../../../hooks/useTheme";
import { ShopItem } from "../../../vite-env";
import { api } from "../../../lib/api";
import { getCosmetic } from "../../../lib/cosmetics";

export function SmallShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const colors = useTheme();

  useEffect(() => {
    fetchShop();
  }, []);

  useEffect(() => {
    if (!items.length) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (!items.length) return;

    const startTime = Date.now();
    const duration = 5000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      if (newProgress >= 100) clearInterval(progressInterval);
    }, 50);

    return () => clearInterval(progressInterval);
  }, [index, items]);

  const fetchShop = async () => {
    try {
      const res = await api.getShopCatalog();
      if (!res.success || !res.data) throw new Error("Bad response");

      const json = res.data;

      const daily =
        json.storefronts.find((s: any) => s.name === "BRDailyStorefront")
          ?.catalogEntries || [];
      const weekly =
        json.storefronts.find((s: any) => s.name === "BRWeeklyStorefront")
          ?.catalogEntries || [];
      const selectedStores = [...weekly, ...daily];

      if (!selectedStores.length) {
        setLoading(false);
        return;
      }

      const loaded: ShopItem[] = [];

      for (const entry of selectedStores) {
        const price = entry.prices?.[0]?.finalPrice ?? 0;
        const id = entry.itemGrants[0].templateId?.split(":")[1];

        if (!id) continue;

        try {
          const data = await getCosmetic(id);
          if (data.status !== 200 || !data.data) continue;

          loaded.push({
            id: data.data.id,
            name: data.data.name,
            description: data.data.description,
            price: price || 0,
            images: {
              featured: data.data.images.featured,
              icon: data.data.images.icon,
            },
            rarity: data.data.rarity,
          });
        } catch {
          continue;
        }
      }

      setItems(loaded.slice(0, 6));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "from-zinc-500 via-zinc-600 to-zinc-700";
      case "uncommon":
        return "from-lime-500 via-lime-600 to-lime-700";
      case "rare":
        return "from-sky-500 via-sky-600 to-sky-700";
      case "epic":
        return "from-purple-500 via-purple-600 to-purple-700";
      case "legendary":
        return "from-orange-500 via-orange-600 to-orange-700";
      case "mythic":
        return "from-yellow-400 via-yellow-500 to-yellow-600";
      case "marvel":
        return "from-red-600 via-red-700 to-red-800";
      case "dc":
        return "from-blue-600 via-blue-700 to-blue-800";
      case "icon series":
        return "from-cyan-500 via-cyan-600 to-cyan-700";
      case "star wars":
        return "from-slate-700 via-slate-800 to-slate-900";
      default:
        return "from-neutral-600 via-neutral-700 to-neutral-800";
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-62.5 h-62.5 min-w-62.5 max-w-62.5 min-h-62.5 max-h-62.5 bg-linear-to-br from-${colors.current.gradient.from} to-${colors.current.gradient.to} flex flex-col items-center justify-center rounded-lg shadow-xl border ${colors.current.border}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-10 h-10 border-4 ${colors.current.border} border-t-transparent rounded-full animate-spin`}
          />
          <span className="text-white text-sm font-semibold tracking-wide">
            Loading...
          </span>
        </div>
      </motion.div>
    );
  }

  if (!items.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-62.5 h-62.5 min-w-62.5 max-w-62.5 min-h-62.5 max-h-62.5 bg-linear-to-br ${colors.current.gradient.from} ${colors.current.gradient.to} flex items-center justify-center rounded-lg shadow-xl border ${colors.current.border}`}
      >
        <span className="text-white text-sm font-semibold tracking-wide">
          No items available
        </span>
      </motion.div>
    );
  }

  const item = items[index];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-62.5 h-62.5 min-w-62.5 max-w-62.5 min-h-62.5 max-h-62.5 rounded-lg overflow-hidden shadow-xl border border-stone-800 bg-black"
    >
      <motion.div
        key={`bg-${index}`}
        className={`absolute inset-0 bg-linear-to-br ${getRarityGradient(
          item.rarity.value,
        )}`}
        initial={{ opacity: 0, scale: 1.07 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{ filter: "brightness(0.85)" }}
      />

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`image-${index}`}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            src={item.images.featured || item.images.icon}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = item.images.icon;
            }}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`info-${index}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-1"
          >
            <h3 className="text-white text-lg font-extrabold leading-tight drop-shadow-md line-clamp-1">
              {item.name}
            </h3>
            <p className="text-gray-300 text-xs leading-snug line-clamp-2">
              {item.description || "No description available."}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <img
                src="https://image.fnbr.co/price/icon_vbucks_50x.png"
                className="w-4 h-4"
                draggable={false}
              />
              <span className="text-white font-bold text-sm">
                {item.price.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
