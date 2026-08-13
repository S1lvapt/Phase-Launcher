import { Download, FolderPlus } from "lucide-react";
import { Config } from "../../../util/config";
import { BuildCard } from "./BuildCard";

interface BuildGridProps {
  builds: [string, any][];
  options: string | null;
  setOptions: (path: string | null) => void;
  handleDeleteBuild: (path: string) => void;
  onImport: () => void;
  onDownload: () => void;
}

export function BuildGrid({
  builds,
  options,
  setOptions,
  handleDeleteBuild,
  onImport,
  onDownload,
}: BuildGridProps) {
  const currentVersion = Config.CURRENT_VERSION;

  const sorted = [...builds].sort(([, a], [, b]) =>
    a.version === currentVersion
      ? -1
      : b.version === currentVersion
        ? 1
        : 0,
  );

  return (
    <div
      className="grid auto-rows-max gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, 225px)" }}
    >
      {sorted.map(([path, build]) => (
        <BuildCard
          key={path}
          path={path}
          build={build}
          options={options}
          setOptions={setOptions}
          handleDeleteBuild={handleDeleteBuild}
          isPublicBuild={build.season === currentVersion}
        />
      ))}

      {/* Import card — same shape as BuildCard */}
      <button
        onClick={onImport}
        className="build-card import-build-card group relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--border)] bg-transparent text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none"
        aria-label="Import build from disk"
      >
        {/* Spacer to match BuildCard's total height */}
        <div className="invisible aspect-[0.86] w-full" aria-hidden="true" />
        <div className="invisible p-4" aria-hidden="true">
          <div className="h-[22px]" />
          <div className="mt-1 h-[16px]" />
          <div className="mt-3 h-[16px]" />
        </div>

        {/* Centered content, overlaid on top of the spacer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-current">
            <FolderPlus size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Import from Disk</p>
            <p className="mt-1 text-xs opacity-60">Add existing build</p>
          </div>
        </div>
      </button>

      {/* Download card — same shape as BuildCard */}
      <button
        onClick={onDownload}
        className="build-card import-build-card group relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--border)] bg-transparent text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none"
        aria-label="Download build"
      >
        <div className="invisible aspect-[0.86] w-full" aria-hidden="true" />
        <div className="invisible p-4" aria-hidden="true">
          <div className="h-[22px]" />
          <div className="mt-1 h-[16px]" />
          <div className="mt-3 h-[16px]" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-current">
            <Download size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">Download Build</p>
            <p className="mt-1 text-xs opacity-60">Fetch {currentVersion} automatically</p>
          </div>
        </div>
      </button>
    </div>
  );
}
