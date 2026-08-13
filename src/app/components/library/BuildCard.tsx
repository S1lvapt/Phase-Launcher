import {
  CheckCircle2,
  FolderOpen,
  Loader2,
  Lock,
  MoreHorizontal,
  Pause,
  Play,
  ShieldAlert,
  ShieldPlus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { SeasonInfo } from "../../../util/seasonInfo";
import { useLibraryStore } from "../../../stores/library";
import { exit } from "../../../util/build/close";
import { start } from "../../../util/build/launch";
import { useAuth } from "../../../hooks/useAuth";
import { Build } from "../../../vite-env";
import { showToast } from "../toaster";
import { api } from "../../../lib/api";
import { Config } from "../../../util/config";
import { useConfigStore } from "../../../stores/settings";

type BuildCardProps = {
  path: string;
  build: Build;
  options: string | null;
  setOptions: (path: string | null) => void;
  handleDeleteBuild: (path: string) => void;
  isPublicBuild: boolean;
};

type LaunchStage =
  | "downloading"
  | "injecting"
  | "launching"
  | "verifying"
  | "done"
  | null;

type LaunchState = {
  file: string;
  progress: number;
  stage: LaunchStage;
  active: boolean;
};

type ValidationError = {
  message: string;
  errors: string[];
};

function formatBuildVersion(version: string) {
  const clMatch = version?.match(/CL[-_]?(\d+)/i);
  if (clMatch) return `Build ${clMatch[1]}`;
  return version?.trim() ? version : "Imported build";
}

export function BuildCard({
  path,
  build,
  options,
  setOptions,
  handleDeleteBuild,
  isPublicBuild,
}: BuildCardProps) {
  const [launchState, setLaunchState] = useState<LaunchState>({
    file: "",
    progress: 0,
    stage: null,
    active: false,
  });
  const [validationError, setValidationError] = useState<ValidationError | null>(
    null,
  );
  const [verifyingFiles, setVerifyingFiles] = useState<string[]>([]);
  const { isValidSession } = useAuth.user();
  const { bubbleBuilds, mobileBuilds } = useConfigStore();
  const optionsRef = useRef<HTMLDivElement>(null);

  const showOptions = options === path;

  const majorVersion = build.season.split(".")[0];
  const seasonImageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
    SeasonInfo(majorVersion).image.replace(/^https?:\/\//, ""),
  )}`;
  const imageUrl =
    build.splash && build.splash !== "no splash" ? build.splash : seasonImageUrl;
  const canLaunch = isPublicBuild && build.enabled !== false && !build.excluded;

  const [imageSrc, setImageSrc] = useState(imageUrl);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Reset the loading state whenever the underlying image changes (e.g. the
  // splash finishes fetching after import, or the build entry updates).
  useEffect(() => {
    setImageSrc(imageUrl);
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!showOptions) return;

    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptions(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions, setOptions]);

  async function addDefenderExclusion(): Promise<boolean> {
    try {
      await invoke("add_defender_exclusion", { path: build.path });
      useLibraryStore.getState().patch(path, { defenderExcluded: true });
      showToast.success("Windows Defender exclusion requested.");
      return true;
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Failed to request Defender exclusion.",
      );
      return false;
    }
  }

  async function revealInExplorer() {
    try {
      await revealItemInDir(build.path);
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : "Failed to open folder.",
      );
    }
  }

  async function launch() {
    if (!canLaunch) return;

    if (build.open) {
      try {
        const result = await exit(path);
        if (result) {
          useLibraryStore.getState().patch(path, { open: false });
        }
      } catch (error) {
        showToast.error(
          error instanceof Error
            ? error.message
            : "Failed to close the game. It may still be running.",
        );
      }
      return;
    }

    if (!build.defenderExcluded) {
      await addDefenderExclusion();
    }

    try {
      const paksResponse = await api.getPaks();
      const pakFilesWhitelist =
        paksResponse.success && paksResponse.data ? paksResponse.data : [];
      const useCustomPaks = Config.LAUNCH_OPTIONS.DOWNLOAD_PAKS || false;

      const customPaksLinks: string[] = [
        ...(Config.LAUNCH_OPTIONS.PAK_LINKS || []),
      ];

      if (Config.LAUNCH_OPTIONS.BUBBLE_BUILDS != null && bubbleBuilds) {
        customPaksLinks.push(...Config.LAUNCH_OPTIONS.BUBBLE_BUILDS.filter(Boolean));
      }

      if (Config.LAUNCH_OPTIONS.MOBILE_BUILDS != null && mobileBuilds) {
        customPaksLinks.push(...Config.LAUNCH_OPTIONS.MOBILE_BUILDS.filter(Boolean));
      } else if (Config.LAUNCH_OPTIONS.DOWNLOAD_PAKS && mobileBuilds) {
        if (Config.LAUNCH_OPTIONS.MOBILE_PAK_URL)
          customPaksLinks.push(Config.LAUNCH_OPTIONS.MOBILE_PAK_URL);
        if (Config.LAUNCH_OPTIONS.MOBILE_SIG_URL)
          customPaksLinks.push(Config.LAUNCH_OPTIONS.MOBILE_SIG_URL);
      }

      const needsDownload = await invoke<boolean>("check_paks_needed", {
        filePath: path,
        useCustomPaks: useCustomPaks,
        customPaksLinks: customPaksLinks,
        pakFilesWhitelist: pakFilesWhitelist,
      });

      if (!needsDownload) {
        const result = await start(path, isValidSession);
        if (result) {
          useLibraryStore.getState().patch(path, { open: true });
        }
        return;
      }
    } catch (err) {
      console.warn("Failed to check PAKs; falling back to normal flow", err);
    }

    setLaunchState({ file: "", progress: 0, stage: "verifying", active: true });
    setValidationError(null);
    setVerifyingFiles([]);

    const unlistenDownload = await listen("download-progress", (event: any) => {
      const payload = event.payload;
      setLaunchState({
        file: payload.file || "",
        progress: payload.progress ?? 0,
        stage: payload.stage ?? "downloading",
        active: true,
      });
    });

    const unlistenVerify = await listen("verify-build", (event: any) => {
      const payload = event.payload;
      const label =
        payload.status === "deleted"
          ? `Removed: ${payload.file}`
          : `Failed to remove: ${payload.file}`;
      setVerifyingFiles((previous) => [...previous, label]);
    });

    const unlistenValidation = await listen(
      "build-validation-error",
      (event: any) => {
        const payload = event.payload;
        setValidationError({
          message: payload.message,
          errors: payload.errors,
        });
        setLaunchState({ file: "", progress: 0, stage: null, active: true });
      },
    );

    // download-complete: downloads finished, game is launching
    const unlistenComplete = await listen("download-complete", () => {
      setLaunchState({ file: "", progress: 100, stage: "launching", active: true });
    });

    // download-error: something went wrong in the backend
    const unlistenError = await listen("download-error", (event: any) => {
      const reason = event.payload?.reason ?? "unknown";
      setValidationError({
        message: `Launch failed: ${reason}`,
        errors: [],
      });
      setLaunchState({ file: "", progress: 0, stage: null, active: true });
    });

    try {
      const result = await start(path, isValidSession);

      if (result) {
        useLibraryStore.getState().patch(path, { open: true });
        // Delay close so the user sees "Requesting admin" briefly
        setTimeout(() => {
          setLaunchState({ file: "", progress: 0, stage: null, active: false });
          setVerifyingFiles([]);
        }, 2000);
      } else {
        // start() returned false without throwing — close the modal
        setLaunchState({ file: "", progress: 0, stage: null, active: false });
        setVerifyingFiles([]);
      }
    } catch (err: any) {
      // Tauri threw an error from launch_game — show it
      setValidationError({
        message: err?.message ?? String(err),
        errors: [],
      });
      setLaunchState({ file: "", progress: 0, stage: null, active: true });
    } finally {
      unlistenDownload();
      unlistenVerify();
      unlistenValidation();
      unlistenComplete();
      unlistenError();
    }
  }

  const statusText =
    launchState.stage === "injecting"
      ? "Injecting"
      : launchState.stage === "launching"
        ? "Requesting admin"
        : launchState.stage === "done"
          ? "Finished"
          : "Preparing";

  const descriptionText = validationError
    ? validationError.message
    : launchState.stage === "verifying"
      ? "Checking build integrity"
      : launchState.stage === "launching"
        ? `Windows may ask to allow Fortnite ${build.season}`
        : launchState.file || "Getting ready";

  const playLabel = !canLaunch
    ? "Locked"
    : build.loading
      ? "Preparing"
      : build.open
        ? "Stop"
        : "Play";

  return (
    <>
      {/* Launch modal */}
      <AnimatePresence>
        {launchState.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              className="launcher-modal max-w-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {validationError ? (
                    <ShieldAlert className="h-6 w-6 text-rose-300" />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-strong)]">
                      {statusText}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {descriptionText}
                    </p>
                  </div>
                </div>

                {launchState.stage !== "launching" && launchState.stage !== "downloading" && launchState.stage !== "verifying" && (
                  <button
                    onClick={() => {
                      setLaunchState((c) => ({ ...c, active: false }));
                      setValidationError(null);
                      setVerifyingFiles([]);
                    }}
                    className="icon-button"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {validationError ? (
                <div className="mt-6 space-y-4">
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-rose-500/20 bg-rose-500/10 p-4">
                    {validationError.errors.map((error) => (
                      <p key={error} className="text-xs leading-5 text-rose-100/80">
                        {error}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setLaunchState((c) => ({ ...c, active: false }))
                    }
                    className="danger-button w-full"
                  >
                    Close
                  </button>
                </div>
              ) : launchState.stage === "verifying" ? (
                <div className="mt-6 space-y-4">
                  {verifyingFiles.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                      {verifyingFiles.map((file) => (
                        <p
                          key={file}
                          className="flex items-center gap-2 text-xs leading-5 text-[var(--text-muted)]"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                          {file}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-[var(--text-muted)]">
                    Verifying pak files before launch
                  </p>
                </div>
              ) : launchState.stage !== "launching" ? (
                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{launchState.file || "Current file"}</span>
                    <span>{launchState.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                    <motion.div
                      className="h-full bg-[var(--accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${launchState.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.article
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="build-card group relative overflow-hidden"
      >
        {/* Image area — click to launch, like Epic's library tiles */}
        <button
          type="button"
          onClick={launch}
          disabled={!canLaunch || build.loading}
          className="relative block w-full aspect-[0.86] overflow-hidden bg-[var(--surface)] disabled:cursor-not-allowed"
          aria-label={build.open ? "Stop build" : "Launch build"}
        >
          {/* Loading placeholder — shown until the image loads, same treatment as the item shop cards */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-soft)]">
              {imageFailed ? (
                <span className="text-[10px] font-medium text-[var(--text-muted)]">
                  No image
                </span>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!imageFailed && (
              <motion.img
                key={imageSrc}
                src={imageSrc}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (imageSrc !== seasonImageUrl) {
                    // Splash failed to load — fall back to the season key art.
                    setImageSrc(seasonImageUrl);
                    setImageLoaded(false);
                  } else {
                    // Fallback also failed — stop showing the spinner for good.
                    setImageFailed(true);
                  }
                }}
              />
            )}
          </AnimatePresence>

          {/* Gradient for legibility of badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

          {/* Hover darken */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/35" />

          {/* Hover accent ring */}
          <div className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-inset ring-[var(--accent)]/0 transition-all duration-300 group-hover:opacity-100 group-hover:ring-[var(--accent)]/40" />

          {/* Loading overlay */}
          {build.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            </div>
          )}

          {/* Running indicator — always visible when game is open */}
          {build.open && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-300">Running</span>
            </div>
          )}

          {/* Locked indicator */}
          {!canLaunch && !build.open && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
              <Lock size={10} className="text-[var(--text-muted)]" />
              <span className="text-[10px] font-medium text-[var(--text-muted)]">Locked</span>
            </div>
          )}

          {/* Hover play overlay — big centered play icon, Epic-style */}
          {canLaunch && !build.loading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
              <div className="flex h-16 w-16 scale-75 items-center justify-center rounded-full bg-black/55 backdrop-blur-md ring-1 ring-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-out group-hover:scale-100">
                {build.open ? (
                  <Pause size={26} className="text-white" fill="currentColor" />
                ) : (
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 4.6c0-.86.95-1.38 1.68-.9l12.3 7.4c.68.41.68 1.4 0 1.8l-12.3 7.4c-.73.48-1.68-.04-1.68-.9V4.6Z"
                      fill="white"
                    />
                  </svg>
                )}
              </div>
              <span className="absolute bottom-4 text-xs font-semibold uppercase tracking-wide text-white drop-shadow-md">
                {build.open ? "Stop" : "Play"}
              </span>
            </div>
          )}
        </button>

        {/* Info row */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-[var(--text-strong)]">
              Fortnite {build.season}
            </h3>

            <div ref={optionsRef} className="relative shrink-0">
              <button
                onClick={() => setOptions(showOptions ? null : path)}
                className="icon-button !h-7 !w-7"
                aria-label="Build options"
                title="Options"
              >
                <MoreHorizontal size={16} />
              </button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="options-menu"
                  >
                    <div className="options-menu-group">
                      <button
                        onClick={() => {
                          setOptions(null);
                          revealInExplorer();
                        }}
                      >
                        <FolderOpen size={14} />
                        Open file location
                      </button>
                      <button
                        onClick={() => {
                          setOptions(null);
                          addDefenderExclusion();
                        }}
                        disabled={build.defenderExcluded}
                      >
                        {build.defenderExcluded ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <ShieldPlus size={14} />
                        )}
                        {build.defenderExcluded
                          ? "Excluded from Defender"
                          : "Exclude from Defender"}
                      </button>
                    </div>
                    <div className="options-menu-group options-menu-group-danger">
                      <button
                        onClick={() => {
                          setOptions(null);
                          handleDeleteBuild(path);
                        }}
                        className="options-menu-danger"
                      >
                        <Trash2 size={14} />
                        Delete build
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p
            className="mt-1 truncate text-xs text-[var(--text-muted)]"
            title={build.version}
          >
            {formatBuildVersion(build.version)}
          </p>

          {/* Play row — Epic-style inline launch control */}
          <button
            onClick={launch}
            disabled={!canLaunch || build.loading}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!canLaunch ? (
              <Lock size={13} />
            ) : build.loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : build.open ? (
              <Pause size={13} />
            ) : (
              <Play size={13} />
            )}
            <span>{playLabel}</span>
          </button>
        </div>
      </motion.article>
    </>
  );
}
