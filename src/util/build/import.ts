"use client";

import { message, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { Config } from "../config";
import { useLibraryStore } from "../../stores/library";

const buildStore = useLibraryStore.getState();

export interface Result {
  path: string;
  status: "imported" | "excluded" | "unsupported";
  build: {
    path: string;
    splash?: string | null;
    open: boolean;
    enabled: boolean;
    excluded?: boolean;
    version: string;
    season: string;
  };
  success: boolean;
}

export type ImportBuildOptions = {
  importUnsupportedAsExcluded?: boolean;
};

export const VERSION_MAP: {
  [key: number]: { version: string; netcl: string };
} = {
  3870737: { version: "2.4.2", netcl: "2.4.2-CL-3870737" },
  3858292: { version: "2.4", netcl: "2.4-CL-3858292" },
  3847564: { version: "2.3", netcl: "2.3-CL-3847564" },
  3841827: { version: "2.2", netcl: "2.2-CL-3841827" },
  3825894: { version: "2.1", netcl: "2.1-CL-3825894" },
  3807424: { version: "1.11", netcl: "1.11-CL-3807424" },
  3790078: { version: "1.10", netcl: "1.10-CL-3790078" },
  3775276: { version: "1.91", netcl: "1.91-CL-3775276" },
  3757339: { version: "1.9", netcl: "1.9-CL-3757339" },
  3729133: { version: "1.8.1", netcl: "1.81-CL-3729133" },
  3724489: { version: "1.8", netcl: "1.8-CL-3724489" },
  3700114: { version: "1.7.2", netcl: "1.72-CL-3700114" },
  3541083: { version: "1.2", netcl: "1.2-CL-3541083" },
  3532353: { version: "1.0", netcl: "1.0-CL-3532353" },
};

const normalizeVersion = (version: string) => {
  const parts = version.split(".");
  if (parts[0]?.length === 2 && parts[1]?.length === 1) {
    return version + "0";
  }
  return version;
};

export const parseVersionInfo = (patternHexCheck: string[]) => {
  const regex = /\+\+Fortnite\+Release-(\d+\.\d+|Cert)-CL-(\d+)/;

  for (const str of patternHexCheck) {
    const match = str.match(regex);
    if (!match) continue;

    const [, versionMatch, clNumber] = match;
    const cl = parseInt(clNumber);
    const isLiveOrCert = str.includes("Live") || str.includes("Cert");

    if (isLiveOrCert && VERSION_MAP[cl]) {
      return VERSION_MAP[cl];
    }

    if (!isLiveOrCert) {
      const version = normalizeVersion(versionMatch);
      return {
        version,
        netcl: `++Fortnite+Release-${version}-CL-${clNumber}-Windows`,
      };
    }
  }

  return { version: "NOT FOUND", netcl: "NOT FOUND" };
};

export const handleAddBuild = async (
  options: ImportBuildOptions = {},
): Promise<Result | null> => {
  try {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return null;

    const selectedPath = selected.toString();
    const splashPath = `${selectedPath}\\FortniteGame\\Content\\Splash\\Splash.bmp`;
    const exePath = `${selectedPath}\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe`;

    const splashExists = await invoke("check_file_exists", {
      path: splashPath,
    });

    let patternHexCheck: string[];
    try {
      patternHexCheck = (await invoke("locate_version", {
        filePath: exePath,
      })) as string[];
    } catch (error) {
      sendNotification({
        title: "Version Detection Failed",
        body: `Failed to analyze the Fortnite executable:\n${exePath}`,
      });
      return null;
    }

    if (!patternHexCheck || !Array.isArray(patternHexCheck)) {
      sendNotification({
        title: "Invalid Version Data",
        body: "Unable to read version information from the Fortnite executable.",
      });
      return null;
    }

    const { version, netcl } = parseVersionInfo(patternHexCheck);

    if (version === "NOT FOUND") {
      await message(
        `Could not detect the Fortnite version from:\n\n${exePath}\n\nThis may be a corrupted installation or an unsupported Fortnite version.`,
        { title: "Version Not Found" },
      );
      return null;
    }

    if (netcl === "NOT FOUND") {
      await message(
        `Found Fortnite version ${version}, but could not detect the network client version.\n\nThis installation may be incomplete or corrupted.`,
        { title: "Network Client Not Found" },
      );
      return null;
    }

    const ver = version;
    const release = `${netcl}`;
    const matched = true;

    const isSupported = Config.ALLOW_ALL_VERSIONS || version === Config.CURRENT_VERSION;
    const shouldExclude = !isSupported && options.importUnsupportedAsExcluded;

    const data = {
      path: selectedPath,
      splash: splashExists ? convertFileSrc(splashPath) : "no splash",
      season: ver,
      version: release,
      enabled: !shouldExclude,
      excluded: shouldExclude,
      open: false,
    };

    if (!isSupported && !options.importUnsupportedAsExcluded) {
        sendNotification({
          title: "Import Error",
          body: `Only builds that are version ${Config.CURRENT_VERSION} are supported.`,
        });
        return {
          path: selectedPath,
          build: data,
          status: "unsupported",
          success: false,
        };
    }

    buildStore.add(selectedPath, data);
    return {
      path: selectedPath,
      build: data,
      status: shouldExclude ? "excluded" : "imported",
      success: matched && isSupported,
    };
  } catch (err) {
    console.error("Failed to add build:", err);
    sendNotification({
      title: "Import Error",
      body: `Failed to add build: ${err}`,
    });
    return null;
  }
};
