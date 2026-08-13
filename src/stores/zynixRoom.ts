import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ZynixRoomState } from "../vite-env";

const DEFAULT_GRADIENT_FROM = "#40a9ff";
const DEFAULT_GRADIENT_TO = "#bf5af2";
const DEFAULT_ROLE_LABEL = "Owner";

export const useZynixRoomStore = create<ZynixRoomState>()(
  persist(
    (set) => ({
      gradientFrom: DEFAULT_GRADIENT_FROM,
      gradientTo: DEFAULT_GRADIENT_TO,
      roleLabel: DEFAULT_ROLE_LABEL,
      welcomeImagePath: null,
      welcomeImageUrl: null,

      setGradient: (from, to) => set({ gradientFrom: from, gradientTo: to }),
      setRoleLabel: (label) => set({ roleLabel: label }),
      setWelcomeImage: (path, url) =>
        set({ welcomeImagePath: path, welcomeImageUrl: url }),

      reset: () =>
        set({
          gradientFrom: DEFAULT_GRADIENT_FROM,
          gradientTo: DEFAULT_GRADIENT_TO,
          roleLabel: DEFAULT_ROLE_LABEL,
          welcomeImagePath: null,
          welcomeImageUrl: null,
        }),
    }),
    {
      name: "storage:zynix-room",
    },
  ),
);
