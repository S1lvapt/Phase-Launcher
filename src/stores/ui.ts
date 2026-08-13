import { create } from "zustand";

interface UIState {
  showLogoutModal: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  showLogoutModal: false,
  openLogoutModal: () => set({ showLogoutModal: true }),
  closeLogoutModal: () => set({ showLogoutModal: false }),
}));
