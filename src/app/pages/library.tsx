import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash } from "lucide-react";
import { BuildGrid } from "../components/library/BuildGrid";
import { useLibraryStore } from "../../stores/library";
import { useAuth } from "../../hooks/useAuth";
import { ImportModal } from "../components/import/ImportModal";
import { BuildDownloadModal } from "../components/download/BuildDownloadModal";
import {
  downloadAndImportBuild,
  cancelBuildDownload,
  BuildDownloadProgress,
} from "../../util/build/downloadBuild";

export function Library() {
  const entries = useLibraryStore((state) => state.entries);
  const builds = Array.from(entries.entries());
  const wipe = useLibraryStore((state) => state.wipe);
  const remove = useLibraryStore((state) => state.delete);

  const [options, setOptions] = useState<string | null>(null);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadState, setDownloadState] = useState<BuildDownloadProgress>({
    stage: "idle",
    progress: 0,
  });

  const user = useAuth.user();

  if (!user.isValidSession()) {
    return null;
  }

  function confirmWipe() {
    wipe();
    setShowConfirmWipe(false);
  }

  async function startDownload() {
    setDownloadState({ stage: "choosing-folder", progress: 0 });
    setDownloadOpen(true);

    const success = await downloadAndImportBuild((state) => {
      setDownloadState(state);
    });

    if (!success) {
      // If the user simply cancelled the folder picker, close the modal
      // instead of leaving an empty "idle" dialog open.
      setDownloadState((current) => {
        if (current.stage === "idle") {
          setDownloadOpen(false);
        }
        return current;
      });
    }
  }

  return (
    <div className="h-full overflow-hidden">
      <main className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-6 px-6 pb-4 pt-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Library</h1>
            <p className="mt-1 text-sm text-white/40">Import and manage your builds.</p>
          </div>

          {builds.length > 0 && (
            <button
              onClick={() => setShowConfirmWipe(true)}
              className="clear-library-button shrink-0"
              aria-label="Clear library"
            >
              <Trash size={14} />
              Clear library
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-20">
          <div>
            <BuildGrid
              builds={builds}
              options={options}
              setOptions={setOptions}
              handleDeleteBuild={remove}
              onImport={() => setImportOpen(true)}
              onDownload={startDownload}
            />
          </div>
        </div>
      </main>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      <BuildDownloadModal
        open={downloadOpen}
        state={downloadState}
        onClose={() => setDownloadOpen(false)}
        onCancel={cancelBuildDownload}
      />

      <AnimatePresence>
        {showConfirmWipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
            onClick={() => setShowConfirmWipe(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 18 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
              className="launcher-modal max-w-[360px]"
            >
              <h2 className="text-2xl font-semibold text-[var(--text-strong)]">
                Clear library?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                This removes {entries.size} imported{" "}
                {entries.size === 1 ? "build" : "builds"} from the launcher.
                It does not delete files from disk.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  onClick={() => setShowConfirmWipe(false)}
                  className="secondary-button flex-1"
                >
                  Cancel
                </button>
                <button onClick={confirmWipe} className="danger-button flex-1">
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
