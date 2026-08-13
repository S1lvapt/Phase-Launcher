"use client";

import { invoke } from "@tauri-apps/api/core";
import { sendNotification } from "@tauri-apps/plugin-notification";

import { Window } from "@tauri-apps/api/window";
import { useLibraryStore } from "../../stores/library";
import { useConfigStore } from "../../stores/settings";
import { Build } from "../../vite-env";
import { Config } from "../config";
import { useUserStore } from "../../stores/user";
import { showToast } from "../../app/components/toaster";
import { api } from "../../lib/api";

const window = new Window("main");

export const start = async (
  buildPath: string,
  isValidSession: () => boolean,
): Promise<boolean> => {
  const lib = useLibraryStore.getState();
  const { email, password, accessToken, accountId, loginMethod } = useUserStore.getState();

  const build: Build | undefined = lib.entries.get(buildPath);

  if (!build) {
    showToast.error(`No build found at path: ${buildPath}`);
    return false;
  }

  if (!isValidSession()) {
    showToast.error(`User is not authenticated.`);
    return false;
  }

  const { minimizeOnLaunch, editOnRelease, resetOnRelease, bubbleBuilds, mobileBuilds, performanceMode } =
    useConfigStore.getState();

  const resetOnReleaseDll =
    resetOnRelease && Config.LAUNCH_OPTIONS.RESET_ON_RELEASE_DLL
      ? Config.LAUNCH_OPTIONS.RESET_ON_RELEASE_DLL
      : "";

  const editOnReleaseDll =
    editOnRelease && Config.LAUNCH_OPTIONS.EDIT_ON_RELEASE_DLL
      ? Config.LAUNCH_OPTIONS.EDIT_ON_RELEASE_DLL
      : "";

  try {
    const normalizedPath = buildPath.split("/").join("\\");
    const fn = `${normalizedPath}\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe`;

    const fileExists = await invoke<boolean>("check_file_exists", {
      path: fn,
    });

    if (!fileExists) {
      console.warn(
        `[Invalid Build] Executable missing for version ${build.version}`,
      );
      return false;
    }

    const extraDllOptions: Record<string, string>[] = [];
    const customPaksLinks: string[] = [];

    if (bubbleBuilds && Config.LAUNCH_OPTIONS.BUBBLE_BUILDS?.length) {
      customPaksLinks.push(...Config.LAUNCH_OPTIONS.BUBBLE_BUILDS.filter(Boolean));
    }

    if (Config.LAUNCH_OPTIONS.DOWNLOAD_PAKS) {
      if (Config.LAUNCH_OPTIONS.PAK_LINKS) {
        customPaksLinks.push(...Config.LAUNCH_OPTIONS.PAK_LINKS);
      }

      if (Config.LAUNCH_OPTIONS.MOBILE_BUILDS != null && mobileBuilds) {
        customPaksLinks.push(...Config.LAUNCH_OPTIONS.MOBILE_BUILDS.filter(Boolean));
      } else if (mobileBuilds) {
        if (Config.LAUNCH_OPTIONS.MOBILE_PAK_URL) {
          customPaksLinks.push(Config.LAUNCH_OPTIONS.MOBILE_PAK_URL);
        }
        if (Config.LAUNCH_OPTIONS.MOBILE_SIG_URL) {
          customPaksLinks.push(Config.LAUNCH_OPTIONS.MOBILE_SIG_URL);
        }
      }
    }

    const paksResponse = await api.getPaks();
    const pakFilesWhitelist =
      paksResponse.success && paksResponse.data ? paksResponse.data : [];

    const backendUrl = Config.BACKEND_URL.replace("http://", "").replace(
      "https://",
      "",
    );

    await invoke("launch_game", {
      filePath: fn,
      authLogin: loginMethod === "discord" ? (accountId ?? "") : (email ?? accountId ?? ""),
      authPassword: loginMethod === "discord" ? (accessToken ?? "") : (password ?? accessToken ?? ""),
      redirectLink: Config.LAUNCH_OPTIONS.REDIRECT_DOWNLOAD || "",
      resetOnReleaseDll: resetOnReleaseDll,
      editOnReleaseDll: editOnReleaseDll,
      backend: backendUrl,
      injectExtraDlls: Config.LAUNCH_OPTIONS.DOWNLOAD_EXTRA_DLLS || false,
      extraDllLinks: Config.LAUNCH_OPTIONS.DLL_LINKS || [],
      useCustomPaks: customPaksLinks.length > 0 || Config.LAUNCH_OPTIONS.DOWNLOAD_PAKS || false,
      customPaksLinks: customPaksLinks,
      extraDllOptions: extraDllOptions,
      pakFilesWhitelist: pakFilesWhitelist,
      acPath: Config.LAUNCH_OPTIONS.ANTICHEAT_PATH || "",
      acDownloadUrl: Config.LAUNCH_OPTIONS.AC_DOWNLOAD_URL || "",
      performanceMode: performanceMode,
    });

    lib.patch(buildPath, { open: true });

    if (minimizeOnLaunch) {
      try {
        await window.minimize();
      } catch (minimizeErr) {
        console.error("Failed to minimize window on launch:", minimizeErr);
      }
    }

    sendNotification({
      title: `Launching ${Config.CURRENT_VERSION}`,
      body: `${Config.NAME} is now launching. If this is your first time launching, it may take a bit longer than usual. Thanks for playing!`,
    });

    return true;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    showToast.error(msg || "Failed to launch the game.");
    console.error("[launch]", err);
    throw err; // re-throw so BuildCard can show it in the modal
  }
};
