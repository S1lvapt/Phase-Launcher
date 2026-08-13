"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShopItem } from "../../../vite-env";

export function SmallShopCard({ item }: { item: ShopItem }) {
  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "from-[#6b727d] via-[#989fa4] to-[#474c54]";

      case "uncommon":
        return "from-[#a1fe00] via-[#61bf00] to-[#024f03]";

      case "rare":
        return "from-[#00afff] via-[#0077c8] to-[#00458a]";

      case "epic":
        return "from-[#ce59ff] via-[#8b32cc] to-[#4c197b]";

      case "legendary":
        return "from-[#ff8b19] via-[#d45c10] to-[#8a3c1d]";

      case "crystal":
        return "from-[#606de0] via-[#6991ff] to-[#284d9c]";

      case "icon":
      case "icon series":
        return "from-[#5cf2f3] via-[#00e0ff] to-[#004c71]";

      case "dc":
        return "from-[#19193f] via-[#212138] to-[#000033]";

      default:
        return "from-neutral-600 via-neutral-700 to-neutral-800";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className="relative w-51.5 h-51.5 rounded-lg overflow-hidden shadow-xl border border-stone-800 bg-black"
    >
      <div
        className={`absolute inset-0 bg-linear-to-br ${getRarityGradient(
          item.rarity.value,
        )}`}
        style={{ filter: "brightness(0.85)" }}
      />

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" />

      <AnimatePresence mode="wait">
        <motion.img
          key={item.id}
          src={item.images.icon}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 m-auto max-w-full max-h-full object-contain drop-shadow-2xl"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = item.images.icon;
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 py-3">
        <h3 className="text-white text-sm font-extrabold leading-tight line-clamp-1">
          {item.name}
        </h3>

        <p className="text-gray-300 text-[11px] leading-snug line-clamp-2">
          {item.description || "No description available."}
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <img
            src="https://image.fnbr.co/price/icon_vbucks_50x.png"
            className="w-3.5 h-3.5"
            draggable={false}
          />
          <span className="text-white font-bold text-xs">
            {item.price.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
