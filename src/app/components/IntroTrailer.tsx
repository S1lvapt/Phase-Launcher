import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useVideoPreload } from "../../hooks/useVideoPreload";

type IntroTrailerProps = {
  onFinish: () => void;
};

const TRAILER_SRC = "/trailer.mp4";

export function IntroTrailer({ onFinish }: IntroTrailerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null);
  const volumeFadeRaf = useRef<number | null>(null);

  // In case this mounts before (or without) the login page having had a
  // chance to preload the trailer, keep preloading here too — this is a
  // no-op once the browser already has it cached.
  const preloaded = useVideoPreload(TRAILER_SRC, true);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const showLoading = !preloaded && !videoCanPlay;

  const HOLD_DURATION_MS = 900;
  const FADE_DURATION_MS = 450;

  function fadeOutVolume() {
    const video = videoRef.current;
    if (!video) return;

    const startVolume = video.volume;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / FADE_DURATION_MS, 1);
      video.volume = startVolume * (1 - progress);

      if (progress < 1) {
        volumeFadeRaf.current = requestAnimationFrame(step);
      } else {
        video.pause();
      }
    };

    volumeFadeRaf.current = requestAnimationFrame(step);
  }

  function finish() {
    if (holdRaf.current != null) {
      cancelAnimationFrame(holdRaf.current);
      holdRaf.current = null;
    }
    fadeOutVolume();
    onFinish();
    setVisible(false);
  }

  function startHold() {
    setHolding(true);
    holdStart.current = performance.now();

    const step = (now: number) => {
      if (holdStart.current == null) return;
      const elapsed = now - holdStart.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        finish();
        return;
      }
      holdRaf.current = requestAnimationFrame(step);
    };

    holdRaf.current = requestAnimationFrame(step);
  }

  function cancelHold() {
    setHolding(false);
    setHoldProgress(0);
    holdStart.current = null;
    if (holdRaf.current != null) {
      cancelAnimationFrame(holdRaf.current);
      holdRaf.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (holdRaf.current != null) cancelAnimationFrame(holdRaf.current);
      if (volumeFadeRaf.current != null) cancelAnimationFrame(volumeFadeRaf.current);
    };
  }, []);

  // Once the video itself reports it's ready to play through without
  // buffering, start playback and hide the loading state.
  function handleCanPlay() {
    setVideoCanPlay(true);
    videoRef.current?.play().catch(() => {
      // Autoplay with sound can be blocked by the platform; the user can
      // still use the skip button, and playback will start muted-less
      // once interaction happens if needed.
    });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: FADE_DURATION_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <video
            ref={videoRef}
            src={TRAILER_SRC}
            autoPlay={false}
            preload="auto"
            muted={false}
            playsInline
            className="h-full w-full object-cover"
            onCanPlay={handleCanPlay}
            onEnded={finish}
          />

          <AnimatePresence>
            {showLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center bg-black"
              >
                <Loader2 className="h-8 w-8 animate-spin text-white/70" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!holding || holdProgress < 1 ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                className="absolute bottom-6 right-6 select-none overflow-hidden rounded-md bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black shadow-lg"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span
                  className="absolute inset-0 bg-black/20"
                  style={{
                    width: `${holdProgress * 100}%`,
                    transition: holding ? "none" : "width 150ms ease-out",
                  }}
                />
                <span className="relative">Hold to Skip</span>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
