"use client";
import { Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function Frame() {
  const appWindow = getCurrentWindow();

  const handleMinimize = async () => {
    await appWindow.minimize();
  };

  const handleClose = async () => {
    await appWindow.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="frame-shell fixed left-0 right-0 top-0 z-50 flex h-8 select-none items-center justify-between pl-3 pr-1.5 text-[13px] text-zinc-100"
    >
      <div className="flex items-center gap-2 font-semibold" data-tauri-drag-region>
        <img src="/icon.png?v=2" className="h-5 w-5 rounded-md" draggable={false} />
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={handleMinimize}
          className="frame-control"
          aria-label="Minimize"
        >
          <Minus size={13} strokeWidth={2.25} />
        </button>

        <button
          onClick={handleClose}
          className="frame-control frame-control-close"
          aria-label="Close"
        >
          <X size={13} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
