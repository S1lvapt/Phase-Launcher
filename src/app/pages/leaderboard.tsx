"use client";

import { useEffect, useRef, useState } from "react";
import { useLeaderboardStore } from "../../stores/leaderboard";
import { useUserStore } from "../../stores/user";
import { Crown, Skull, Target, AlertCircle } from "lucide-react";
import { rpc } from "../../lib/rpc";

type LeaderboardStat = "wins" | "kills" | "score";

const STAT_LABEL: Record<LeaderboardStat, string> = {
  wins: "Wins",
  kills: "Kills",
  score: "Score",
};

const STAT_ICON: Record<LeaderboardStat, typeof Crown> = {
  wins: Crown,
  kills: Skull,
  score: Target,
};

const STAT_TABS: LeaderboardStat[] = ["wins", "kills", "score"];

export function Leaderboard() {
  const { entries, loading, error, fetchLeaderboard } = useLeaderboardStore();
  const userAccountId = useUserStore.getState().accountId;

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [stat, setStat] = useState<LeaderboardStat>("wins");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighlightedIndex(null);
    fetchLeaderboard("showdownalt_solo", stat, "keyboardmouse");
  }, [stat]);

  useEffect(() => {
    rpc.inLeaderboard();
  }, []);

  const userIndex = entries.findIndex((e) => e.account === userAccountId);

  const scrollToUser = () => {
    if (userIndex === -1 || !containerRef.current) return;
    const el = containerRef.current.querySelector(
      `[data-index='${userIndex}']`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedIndex(userIndex);
    setTimeout(() => setHighlightedIndex(null), 3000);
  };

  return (
    <div className="flex flex-col h-full px-6 py-6">
      <div className="shrink-0 mb-3">
        <h2 className="text-4xl font-bold text-white mb-1">Leaderboard</h2>
        <p className="text-white/40 text-sm">
          Top players by {STAT_LABEL[stat].toLowerCase()}
        </p>
      </div>

      {/* Stat tabs */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        {STAT_TABS.map((tabStat) => (
          <button
            key={tabStat}
            onClick={() => setStat(tabStat)}
            disabled={loading}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
              stat === tabStat
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-soft)]"
                : "bg-white/8 text-white/70 hover:bg-white/12 hover:text-white border border-white/10"
            }`}
          >
            {STAT_LABEL[tabStat]}
          </button>
        ))}
      </div>

      {/* Column header */}
      <div className="leaderboard-row flex items-center justify-between rounded-lg px-4 py-2.5 mb-1.5 shrink-0">
        <span className="text-sm font-bold text-white">Username</span>
        <span className="text-sm font-bold text-white">{STAT_LABEL[stat]}</span>
      </div>

      {/* Entries */}
      <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 border border-white border-t-transparent animate-spin rounded-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-white/70 text-sm max-w-xs">{error}</p>
            <button
              onClick={() => fetchLeaderboard("showdownalt_solo", stat, "keyboardmouse")}
              className="mt-1 px-4 py-1.5 rounded-full text-sm font-semibold leaderboard-row text-white hover:brightness-110"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-white/50 text-sm">No entries found.</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isHighlighted = index === highlightedIndex;
            const StatIcon = STAT_ICON[stat];
            const isMe = entry.account === userAccountId;

            return (
              <div
                key={`${entry.account}-${index}`}
                data-index={index}
                className={`leaderboard-row flex items-center justify-between rounded-lg px-4 py-2.5 mb-1 cursor-default transition-all ${
                  isHighlighted || isMe
                    ? "ring-1 ring-[var(--accent)] brightness-125"
                    : "hover:brightness-110"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-7 text-sm font-bold shrink-0 ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-slate-300"
                        : index === 2
                        ? "text-amber-600"
                        : "text-white/40"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className={`font-semibold text-sm ${isMe ? "text-[var(--accent)]" : "text-white"}`}>
                    {entry.displayName}
                  </span>
                </div>

                <span className="font-bold flex items-center gap-2 text-white text-sm">
                  <StatIcon size={15} className="text-[var(--accent)]" />
                  {entry.value.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Jump to me */}
      {!loading && !error && userIndex !== -1 && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full shadow-xl cursor-pointer select-none z-20 bg-[var(--surface-soft)] border border-[var(--border)] hover:brightness-110 transition-all"
          onClick={scrollToUser}
        >
          <span className="text-white font-semibold text-sm">
            You: #{userIndex + 1}
          </span>
        </div>
      )}
    </div>
  );
}
