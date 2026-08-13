"use client";

import { ShopItem } from "../../../vite-env";
import { SmallShopCard } from "./SmallShopCard";

export function DailyGrid({ items }: { items: ShopItem[] }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, 206px)" }}
    >
      {items.map((item) => (
        <SmallShopCard key={item.id} item={item} />
      ))}
    </div>
  );
}
