import { AnimatePresence, motion } from "framer-motion";
import { Check, FolderPlus, Loader2, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { handleAddBuild, Result } from "../../../util/build/import";

type ImportModalProps = {
  open: boolean;
  onboarding?: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

export function ImportModal({
  open,
  onboarding = false,
  onClose,
  onComplete,
}: ImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function importBuild() {
    setImporting(true);
    setResult(null);

    try {
      const imported = await handleAddBuild();

      if (imported) {
        setResult(imported);
      }
    } finally {
      setImporting(false);
    }
  }

  function close() {
    setResult(null);
    onClose();
  }

  function finish() {
    onComplete?.();
    close();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-5 backdrop-blur-xl"
          onClick={close}
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
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
                    {onboarding ? "Bring in your first build" : "Import build"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Select a Fortnite folder and the launcher will detect its
                    version, splash art, and launch compatibility.
                  </p>
                </div>
              </div>

              <button className="modal-close-button" onClick={close} aria-label="Close">
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 flex gap-3 rounded-lg border p-4 ${
                  result.status === "unsupported"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                {result.status === "unsupported" ? (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <Check className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {result.status === "excluded"
                      ? "Imported as excluded"
                      : result.status === "unsupported"
                        ? "Build not imported"
                        : "Build imported"}
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    Fortnite {result.build.season}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {onboarding ? (
                <button className="text-button" onClick={finish}>
                  Skip for now
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-3">
                <button className="secondary-button" onClick={close}>
                  Done
                </button>
                <button
                  className="primary-button"
                  onClick={importBuild}
                  disabled={importing}
                >
                  {importing ? <Loader2 className="animate-spin" size={18} /> : null}
                  Choose folder
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
