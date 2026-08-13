import { useAuth } from "../../hooks/useAuth";
import { News } from "../components/home/news";
import { ProfileCardsRow } from "../components/home/greeting";
import { SupportCards } from "../components/home/SupportCards";
import { useEffect } from "react";
import { rpc } from "../../lib/rpc";
import { useUserStore } from "../../stores/user";

export function Home() {
  const auth = useAuth.user();
  const displayName = useUserStore((s) => s.displayName);

  useEffect(() => {
    if (displayName) rpc.inLauncher(displayName);
  }, []);

  if (!auth.isValidSession()) {
    return null;
  }

  return (
    <div className="home-dashboard">
      {/* Greeting title + profile stat cards */}
      <ProfileCardsRow />

      {/* News carousel — flex-1 so it fills the remaining height */}
      <div className="min-h-0 flex-1">
        <News />
      </div>

      {/* Support + Discord — fixed height at bottom */}
      <SupportCards />
    </div>
  );
}
