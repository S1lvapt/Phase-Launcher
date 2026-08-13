import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

type FortniteProfile = {
  rvn: number;
  commandRevision: number;
  stats: any;
  items: Record<string, any>;
};

type ProfileStore = {
  hydrated: boolean;
  profiles: Record<string, FortniteProfile>;

  setHydrated: () => void;
  setProfile: (profileId: string, profile: FortniteProfile) => void;
  clearProfiles: () => void;

  fetchProfile: (
    accountId: string,
    profileId: "athena" | "common_core",
    token: string,
  ) => Promise<void>;

  getFavoriteCharacter: () => string | null;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profiles: {},

      setHydrated: () => set({ hydrated: true }),

      setProfile: (profileId, profile) =>
        set((state) => ({
          profiles: {
            ...state.profiles,
            [profileId]: profile,
          },
        })),

      clearProfiles: () => set({ profiles: {} }),

      fetchProfile: async (accountId, profileId, token) => {
        if (!accountId || !profileId || !token) return;

        try {
          const res = await api.postQueryProfile(accountId, profileId, token);

          if (!res.success) return;

          const fullUpdate = res.data.profileChanges?.find(
            (c: any) => c.changeType === "fullProfileUpdate",
          );

          if (!fullUpdate?.profile) return;

          set((state) => ({
            profiles: {
              ...state.profiles,
              [profileId]: fullUpdate.profile,
            },
          }));
        } catch {
          // Silent — profile data is non-critical on startup
        }
      },

      getFavoriteCharacter: () => {
        const athena = get().profiles["athena"];
        const raw = athena?.stats?.attributes?.favorite_character;
        if (!raw) return null;
        // Epic returns this as "AthenaCharacter:cid_001_..." (a template id with
        // an item-type prefix). fortnite-api.com only accepts the bare cosmetic
        // id, so strip everything up to and including the last ':'.
        const idOnly = raw.includes(":") ? raw.split(":").pop() : raw;
        return idOnly || null;
      },
    }),
    {
      name: "storage:profiles",
      partialize: (state) => ({
        profiles: state.profiles,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
