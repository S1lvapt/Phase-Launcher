import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ConfigState } from "../vite-env";
import { invoke } from "@tauri-apps/api/core";
import { Config } from "../util/config";

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      minimizeOnLaunch: false,
      minimizeSidebar: false,
      theme: "obsidian",
      backgroundPattern: "dust",

      editOnRelease: false,
      editAndRelease: false,
      resetOnRelease: false,
      alwaysOnTop: false,
      performanceMode: false,
      bubbleBuilds: false,
      mobileBuilds: false,

      showEditOnRelease: !!Config.LAUNCH_OPTIONS.EDIT_ON_RELEASE_DLL,
      showBubbleBuilds: (Config.LAUNCH_OPTIONS.BUBBLE_BUILDS?.length ?? 0) > 0,
      showMobileBuilds: false,
      showResetOnRelease: !!Config.LAUNCH_OPTIONS.RESET_ON_RELEASE_DLL,
      showMinimizeOnLaunch: true,
      showAlwaysOnTop: true,
      showTrailer: true,

      setBubbleBuilds: (value) =>
        set(() => (value ? { bubbleBuilds: true, mobileBuilds: false } : { bubbleBuilds: false })),
      setMobileBuilds: (value) =>
        set(() => (value ? { mobileBuilds: true, bubbleBuilds: false } : { mobileBuilds: false })),
      setMinimizeSidebar: (value) => set({ minimizeSidebar: value }),

      setEditOnRelease: (value) => set({ editOnRelease: value }),
      setEditAndRelease: (value) => set({ editAndRelease: value }),
      setResetOnRelease: (value) => set({ resetOnRelease: value }),
      setPerformanceMode: (value) => set({ performanceMode: value }),

      setMinimizeOnLaunch: (value) => set({ minimizeOnLaunch: value }),
      setAlwaysOnTop: async (value) => {
        await invoke("set_always_on_top", { alwaysOnTop: value });
        set({ alwaysOnTop: value });
      },

      toggleMinimizeOnLaunch: () =>
        set((state) => ({ minimizeOnLaunch: !state.minimizeOnLaunch })),

      setTheme: (theme) => set({ theme }),
      setBackgroundPattern: (backgroundPattern) => set({ backgroundPattern }),
    }),
    {
      name: "settings",
      partialize: (state) => {
        const {
          showEditOnRelease,
          showBubbleBuilds,
          showMobileBuilds,
          showResetOnRelease,
          showMinimizeOnLaunch,
          showAlwaysOnTop,
          showTrailer,
          ...rest
        } = state;
        return rest;
      },
    },
  ),
);
