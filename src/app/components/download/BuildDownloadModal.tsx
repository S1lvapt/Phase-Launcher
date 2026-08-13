import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, FileArchive, Loader2, X } from "lucide-react";
import type { BuildDownloadProgress } from "../../../util/build/downloadBuild";

type BuildDownloadModalProps = {
  open: boolean;
  state: BuildDownloadProgress;
  onClose: () => void;
  onCancel?: () => void;
};

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 GB";
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(2)} GB`;
}

function shortenFileName(path?: string): string {
  if (!path) return "";
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

const STAGE_LABEL: Record<string, string> = {
  idle: "",
  "choosing-folder": "Waiting for folder selection…",
  downloading: "Downloading build…",
  retrying: "Connection dropped, resuming…",
  extracting: "Extracting archive…",
  importing: "Registering build…",
  done: "Build ready!",
  cancelled: "Download cancelled",
  error: "Something went wrong",
};

export function BuildDownloadModal({ open, state, onClose, onCancel }: BuildDownloadModalProps) {
  const isTerminal =
    state.stage === "done" || state.stage === "error" || state.stage === "cancelled";
  const canClose = isTerminal;
  const canCancel =
    Boolean(onCancel) && (state.stage === "downloading" || state.stage === "retrying");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-5 backdrop-blur-xl"
          onClick={() => canClose && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            className="launcher-modal w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  {state.stage === "extracting" ? (
                    <FileArchive size={20} />
                  ) : (
                    <Download size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
                    Download Build
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    {STAGE_LABEL[state.stage] ?? ""}
                  </p>
                </div>
              </div>

              {canClose && (
                <button className="modal-close-button" onClick={onClose} aria-label="Close">
                  <X size={16} strokeWidth={2.25} />
                </button>
              )}
            </div>

            {state.stage !== "idle" && state.stage !== "choosing-folder" && (
              <div className="mt-6">
                {state.stage === "error" ? (
                  <div className="flex gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
                    <X className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Download failed</p>
                      <p className="mt-1 text-xs opacity-80">{state.error}</p>
                    </div>
                  </div>
                ) : state.stage === "done" ? (
                  <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Build imported</p>
                      <p className="mt-1 text-xs opacity-80">
                        It's now available in your library.
                      </p>
                    </div>
                  </div>
                ) : state.stage === "cancelled" ? (
                  <div className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-[var(--text-muted)]">
                    <X className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-strong)]">
                        Download cancelled
                      </p>
                      <p className="mt-1 text-xs opacity-80">
                        No progress was lost — you can restart the download any time.
                      </p>
                    </div>
                  </div>
                ) : state.stage === "retrying" ? (
                  <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                    <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold">Connection dropped</p>
                      <p className="mt-1 text-xs opacity-80">
                        Resuming automatically (attempt {state.retryAttempt} of{" "}
                        {state.retryMax})… no progress is lost.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[var(--accent)]"
                        animate={{ width: `${Math.max(state.progress, 2)}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                        <Loader2 size={12} className="shrink-0 animate-spin" />
                        <span className="truncate" title={state.currentFile}>
                          {state.stage === "downloading"
                            ? `${formatBytes(state.downloadedBytes)} / ${formatBytes(state.totalBytes)}`
                            : shortenFileName(state.currentFile)}
                        </span>
                      </span>
                      <span className="shrink-0">{state.progress.toFixed(0)}%</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-7 flex items-center justify-end gap-3">
              {canCancel && (
                <button className="secondary-button" onClick={onCancel}>
                  Cancel download
                </button>
              )}
              <button
                className={canClose ? "primary-button" : "secondary-button opacity-60"}
                onClick={onClose}
                disabled={!canClose}
              >
                {canClose ? "Done" : "Please wait…"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
