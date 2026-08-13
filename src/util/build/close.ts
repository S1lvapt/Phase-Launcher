import { invoke } from "@tauri-apps/api/core";
import { useLibraryStore } from "../../stores/library";
import { Build } from "../../vite-env";

export const exit = async (path: string): Promise<boolean> => {
  // Let this throw — the caller needs to know if closing actually failed
  // (e.g. UAC prompt cancelled, or the game didn't actually close) instead
  // of silently treating the build as closed.
  await invoke("close_game", {});

  const BuildState = useLibraryStore.getState();
  const selectedBuild: Build | undefined = BuildState.entries.get(path);

  if (!selectedBuild) {
    console.error("build not found in BuildState:", path);
    return false;
  }

  selectedBuild.open = false;
  BuildState.patch(path, selectedBuild);

  return true;
};
