import { create } from "zustand";
import { api } from "../lib/api";

export type LeaderboardEntry = {
  displayName: string;
  account: string;
  value: number;
};

type LeaderboardState = {
  entries: LeaderboardEntry[];
  loading: boolean;
  error?: string;

  fetchLeaderboard: (
    playlist: string,
    stat: "wins" | "kills" | "score",
    input: "keyboardmouse" | "pc",
  ) => Promise<void>;
};

const STAT_MAP: Record<string, string> = {
  wins: "placetop1",
  kills: "kills",
  score: "score",
};

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  loading: false,
  error: undefined,

  fetchLeaderboard: async (playlist, stat, input) => {
    // Clear previous entries immediately so the old list doesn't flash
    // while the new one loads.
    set({ loading: true, error: undefined, entries: [] });

    const leaderboardName = `br_${STAT_MAP[stat]}_${input}_m0_playlist_${playlist}`;

    const res = await api.getStatsV2Leaderboard(leaderboardName);

    if (!res.success || !res.data) {
      set({
        loading: false,
        error: res.error || "Failed to load leaderboard",
        entries: [],
      });
      return;
    }

    const entries: LeaderboardEntry[] = (res.data.entries ?? []).map((e) => ({
      displayName: e.displayName,
      // Some backend builds return `accountId` instead of `account`
      account: (e as any).accountId ?? e.account,
      value: e.value,
    }));

    set({ entries, loading: false });
  },
}));
