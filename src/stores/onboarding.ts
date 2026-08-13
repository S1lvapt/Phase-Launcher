import { create } from "zustand";

type OnboardingState = {
  completed: boolean;
  dismissedImport: boolean;
  complete: () => void;
  reset: () => void;
  dismissImport: () => void;
};

const ONBOARDING_KEY = "storage:onboarding";

const readInitial = () => {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(ONBOARDING_KEY) === "complete";
  } catch {
    return false;
  }
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: readInitial(),
  dismissedImport: false,

  complete: () => {
    localStorage.setItem(ONBOARDING_KEY, "complete");
    set({ completed: true, dismissedImport: true });
  },

  reset: () => {
    localStorage.removeItem(ONBOARDING_KEY);
    set({ completed: false, dismissedImport: false });
  },

  dismissImport: () => {
    set({ dismissedImport: true });
  },
}));
