"use client";

import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { Config } from "../config";
import { useLibraryStore } from "../../stores/library";
import { parseVersionInfo } from "./import";

const buildStore = useLibraryStore.getState();

export type BuildDownloadStage =
  | "idle"
  | "choosing-folder"
  | "downloading"
  | "retrying"
  | "extracting"
  | "importing"
  | "done"
  | "cancelled"
  | "error";

export type BuildDownloadProgress = {
  stage: BuildDownloadStage;
  progress: number; // 0-100 for the current stage
  downloadedBytes?: number;
  totalBytes?: number;
  currentFile?: string;
  error?: string;
  retryAttempt?: number;
  retryMax?: number;
};

export type BuildDownloadHandle = {
  cancel: () => void;
};

/**
 * Signals the in-progress build download to stop as soon as possible.
 * Only takes effect during the "downloading"/"retrying" stage — once
 * extraction starts the archive is already fully on disk, so there is
 * nothing left to cancel.
 */
export async function cancelBuildDownload(): Promise<void> {
  try {
    await invoke("cancel_build_download");
  } catch (err) {
    console.error("Failed to cancel build download:", err);
  }
}

type ProgressCallback = (state: BuildDownloadProgress) => void;

/**
 * Downloads the full build archive from Config.LAUNCH_OPTIONS.REDIRECT_DOWNLOAD's
 * host (see BUILD_DOWNLOAD_URL below), extracts it, and registers it in the
 * library — mirroring what handleAddBuild does for a manually-picked folder.
 */
export const BUILD_DOWNLOAD_URL =
  "https://dl.fortforge.co.uk/download/bb7ccb3a-fead-4ccd-85e8-9020231b7639/build";

export async function downloadAndImportBuild(
  onProgress: ProgressCallback,
): Promise<boolean> {
  onProgress({ stage: "choosing-folder", progress: 0 });

  const selected = await open({ directory: true, multiple: false });
  if (!selected) {
    onProgress({ stage: "idle", progress: 0 });
    return false;
  }

  const destDir = selected.toString();
  const archiveName = BUILD_DOWNLOAD_URL.split("/").pop() || "build.rar";
  const archivePath = `${destDir}\\${archiveName}`;

  const unlistenDownload = await listen<any>("download-progress", (event) => {
    const payload = event.payload;
    if (payload?.type !== "build") return;

    if (payload.stage === "retrying") {
      onProgress({
        stage: "retrying",
        progress: 0,
        retryAttempt: payload.attempt,
        retryMax: payload.max_attempts,
      });
      return;
    }

    onProgress({
      stage: "downloading",
      progress: payload.progress ?? 0,
      downloadedBytes: payload.downloaded,
      totalBytes: payload.total,
    });
  });

  const unlistenExtract = await listen<any>("extract-progress", (event) => {
    const payload = event.payload;
    if (payload?.type !== "build") return;

    onProgress({
      stage: "extracting",
      progress: payload.progress ?? 0,
      currentFile: payload.file,
    });
  });

  try {
    onProgress({ stage: "downloading", progress: 0 });
    await invoke("download_build", {
      url: BUILD_DOWNLOAD_URL,
      destPath: archivePath,
    });

    onProgress({ stage: "extracting", progress: 0 });
    await invoke("extract_build", {
      archivePath: archivePath,
      destDir: destDir,
    });

    // Best-effort cleanup of the archive now that it's extracted.
    try {
      await invoke("delete_file", { filePath: archivePath });
    } catch {
      // Non-fatal — leftover archive can be removed manually.
    }

    onProgress({ stage: "importing", progress: 0 });

    const buildRoot = await invoke<string | null>("find_fortnite_game_root", {
      searchDir: destDir,
    });

    if (!buildRoot) {
      onProgress({
        stage: "error",
        progress: 0,
        error: "Could not locate a FortniteGame folder inside the extracted archive.",
      });
      return false;
    }

    const imported = await importExtractedBuild(buildRoot);

    if (!imported) {
      onProgress({
        stage: "error",
        progress: 0,
        error: "Extracted build could not be validated. Check the folder structure.",
      });
      return false;
    }

    onProgress({ stage: "done", progress: 100 });
    sendNotification({
      title: "Build Downloaded",
      body: `Fortnite ${Config.CURRENT_VERSION} downloaded and added to your library.`,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes("cancelled")) {
      onProgress({ stage: "cancelled", progress: 0 });
      return false;
    }

    console.error("Build download failed:", err);
    onProgress({
      stage: "error",
      progress: 0,
      error: message,
    });
    sendNotification({
      title: "Download Failed",
      body: `Failed to download build: ${err}`,
    });
    return false;
  } finally {
    unlistenDownload();
    unlistenExtract();
  }
}

/**
 * Same detection/registration logic as handleAddBuild in import.ts, but
 * pointed at a folder we just extracted ourselves instead of one picked
 * interactively — so downloaded builds show up in the library exactly
 * like manually imported ones.
 */
async function importExtractedBuild(selectedPath: string): Promise<boolean> {
  const splashPath = `${selectedPath}\\FortniteGame\\Content\\Splash\\Splash.bmp`;
  const exePath = `${selectedPath}\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe`;

  const splashExists = await invoke("check_file_exists", { path: splashPath });

  let patternHexCheck: string[];
  try {
    patternHexCheck = (await invoke("locate_version", {
      filePath: exePath,
    })) as string[];
  } catch {
    return false;
  }

  if (!patternHexCheck || !Array.isArray(patternHexCheck)) {
    return false;
  }

  const { version, netcl } = parseVersionInfo(patternHexCheck);
  if (version === "NOT FOUND" || netcl === "NOT FOUND") {
    return false;
  }

  const isSupported = Config.ALLOW_ALL_VERSIONS || version === Config.CURRENT_VERSION;

  const data = {
    path: selectedPath,
    splash: splashExists ? convertFileSrc(splashPath) : "no splash",
    season: version,
    version: netcl,
    enabled: isSupported,
    excluded: !isSupported,
    open: false,
  };

  buildStore.add(selectedPath, data);
  return true;
}
