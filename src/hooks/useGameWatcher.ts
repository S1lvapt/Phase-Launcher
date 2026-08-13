"use client";

import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLibraryStore } from "../stores/library";
import { useUserStore } from "../stores/user";
import { rpc } from "../lib/rpc";
import { Config } from "../util/config";

const POLL_INTERVAL_MS = 5000;

export function useGameWatcher() {
  const wasRunningRef = useRef(false);
  const pollingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (pollingRef.current) return;
      pollingRef.current = true;

      try {
        const running = await invoke<boolean>("is_fn_running");
        if (cancelled) return;

        if (running && !wasRunningRef.current) {
          rpc.inGame(Config.CURRENT_VERSION);
        }

        if (!running && wasRunningRef.current) {
          const lib = useLibraryStore.getState();
          for (const [path, build] of lib.entries) {
            if (build.open) lib.patch(path, { open: false });
          }
          const displayName = useUserStore.getState().displayName ?? "";
          rpc.idle(displayName);
        }

        wasRunningRef.current = running;
      } catch {
        // Ignore — non-critical
      } finally {
        pollingRef.current = false;
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
