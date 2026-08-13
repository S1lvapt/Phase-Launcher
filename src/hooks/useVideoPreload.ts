"use client";

import { useEffect, useState } from "react";

/**
 * Preloads a video into the browser's HTTP cache in the background so that
 * a later <video> element pointing at the same src can start playback
 * immediately without buffering.
 *
 * Returns `true` once the video has buffered enough to play through
 * without stalling (canplaythrough), `false` otherwise.
 */
export function useVideoPreload(src: string, enabled: boolean = true): boolean {
  const [preloaded, setPreloaded] = useState(false);

  useEffect(() => {
    if (!enabled || !src) return;

    // Already preloaded in this session — no need to redo the work.
    if (preloaded) return;

    let cancelled = false;
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = src;

    function handleReady() {
      if (!cancelled) setPreloaded(true);
    }

    video.addEventListener("canplaythrough", handleReady);
    // Kick off buffering.
    video.load();

    return () => {
      cancelled = true;
      video.removeEventListener("canplaythrough", handleReady);
      video.src = "";
    };
  }, [src, enabled, preloaded]);

  return preloaded;
}
