import { FolderPlus } from "lucide-react";
import { Config } from "../../../util/config";

type EmptyStateProps = {
  onImport?: () => void;
};

export function EmptyState({ onImport }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--accent)]">
        <FolderPlus size={24} />
      </div>
      <h3 className="text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
        No builds yet
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-muted)]">
        Import your local {Config.NAME} build to start. Unsupported versions can
        stay excluded so your library remains organized.
      </p>
      {onImport && (
        <button onClick={onImport} className="primary-button mt-7">
          <FolderPlus size={18} />
          Import build
        </button>
      )}
    </div>
  );
}

export default EmptyState;
