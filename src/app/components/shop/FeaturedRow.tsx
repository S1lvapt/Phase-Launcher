"use client";

import { ShopItem } from "../../../vite-env";
import { BigFeaturedCard } from "./BigFeaturedCard";

export function FeaturedRow({ items }: { items: ShopItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <BigFeaturedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
