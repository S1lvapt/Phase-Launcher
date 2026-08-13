import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "../../stores/user";

type WelcomeSplashProps = {
  onFinish: () => void;
  visible: boolean;
};

const DISPLAY_DURATION_MS = 1900;

export function WelcomeSplash({ onFinish, visible }: WelcomeSplashProps) {
  const displayName = useUserStore((s) => s.displayName);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(onFinish, DISPLAY_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[var(--surface)]"
        >
          <motion.img
            src="/icon.png"
            alt="Phase"
            className="h-16 w-16 rounded-2xl shadow-xl"
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            draggable={false}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span className="text-base font-bold text-white">
              Welcome back{displayName ? `, ${displayName}` : ""}
            </span>
            <span className="text-xs font-medium text-white/35 tracking-widest uppercase">
              Phase
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
