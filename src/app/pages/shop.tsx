import { Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useShopItems } from "../../hooks/useShopItems";
import { FeaturedRow } from "../components/shop/FeaturedRow";
import { DailyGrid } from "../components/shop/DailyGrid";
import { useProfileStore } from "../../stores/profile";
import { useEffect, useState } from "react";
import { rpc } from "../../lib/rpc";

export function Shop() {
  const auth = useAuth.user();
  const { featured, daily, loading, expiration } = useShopItems();
  const [timeLeft, setTimeLeft] = useState("∞");

  // Update Discord RPC when the shop page is opened
  useEffect(() => {
    rpc.inShop();
  }, []);

  useEffect(() => {
    if (!expiration) return;

    const end = new Date(expiration).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours.toString().padStart(2, "0")}h`);
        return;
      }

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiration]);

  const vbucks =
    useProfileStore(
      (s) =>
        s.profiles?.common_core?.items?.["Currency:MtxPurchased"]?.quantity,
    ) ?? 0;

  if (!auth.isValidSession()) return null;

  if (loading) {
    return (
      <div className="min-h-full min-w-full p-4 flex items-center justify-center">
        <div className="bg-transparent h-5 w-5 border border-white border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!featured.length && !daily.length) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-8 py-7 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-strong)]">
            We couldn't find anything in the item shop...
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Try again later or check your backend connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col px-4 py-6">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Item Shop</h1>
          <p className="text-sm text-white/40 mt-0.5">Latest cosmetics available now</p>
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl border border-white/8 bg-white/4 font-semibold text-white text-sm shrink-0">
          <div className="flex items-center gap-1.5">
            <img src="https://image.fnbr.co/price/icon_vbucks_50x.png" className="w-4 h-4" draggable={false} />
            {vbucks.toLocaleString()}
          </div>
          <div className="h-4 w-px bg-white/15" />
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
            <Clock size={12} className="shrink-0" />
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1 pb-6 space-y-10">
        {featured.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              Featured{" "}
              <span className="text-sm font-normal text-white/50">
                ({featured.length})
              </span>
            </h2>
            <FeaturedRow items={featured} />
          </section>
        )}

        {daily.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              Daily{" "}
              <span className="text-sm font-normal text-white/50">
                ({daily.length})
              </span>
            </h2>
            <DailyGrid items={daily} />
          </section>
        )}
      </div>
    </div>
  );
}
