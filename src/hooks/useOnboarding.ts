import { useMemo } from "react";
import { useLibraryStore } from "../stores/library";
import { useOnboardingStore } from "../stores/onboarding";

export function useOnboarding() {
  const builds = useLibraryStore((state) => state.entries);
  const onboarding = useOnboardingStore();

  const shouldShow = useMemo(() => {
    return !onboarding.completed && builds.size === 0;
  }, [builds.size, onboarding.completed]);

  return {
    shouldShow,
    ...onboarding,
  };
}
