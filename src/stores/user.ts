import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Profile } from "../vite-env";

export const useUserStore = create<Profile>()(
  persist(
    (set) => ({
      accountId: null,
      accessToken: "",
      displayName: null,
      email: null,
      password: null,
      refreshToken: null,
      loginMethod: null,
      discordAvatar: null,
      discordAvatarDecoration: null,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      setProfile: (user) => set((state) => ({ ...state, ...user })),

      clearProfile: () =>
        set({
          accountId: null,
          displayName: null,
          accessToken: "",
          email: null,
          password: null,
          refreshToken: null,
          loginMethod: null,
          discordAvatar: null,
          discordAvatarDecoration: null,
        }),

      login: (user) =>
        set({
          accountId: user.accountId,
          accessToken: user.accessToken,
          displayName: user.displayName,
          email: user.email,
          password: user.password,
          refreshToken: user.refreshToken ?? null,
          loginMethod: user.loginMethod ?? "password",
          discordAvatar: user.discordAvatar ?? null,
          discordAvatarDecoration: user.discordAvatarDecoration ?? null,
        }),

      logout: () =>
        set({
          accountId: null,
          displayName: null,
          accessToken: "",
          email: null,
          password: null,
          refreshToken: null,
          loginMethod: null,
          discordAvatar: null,
          discordAvatarDecoration: null,
        }),
    }),
    {
      name: "storage:user",
      partialize: (state) => ({
        accountId: state.accountId,
        accessToken: state.accessToken,
        displayName: state.displayName,
        email: state.email,
        password: state.password,
        refreshToken: state.refreshToken,
        loginMethod: state.loginMethod,
        discordAvatar: state.discordAvatar,
        discordAvatarDecoration: state.discordAvatarDecoration,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
