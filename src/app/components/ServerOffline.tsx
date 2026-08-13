import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";

export function ServerOffline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/96 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 28 }}
        className="flex flex-col items-center gap-4 text-center px-8 max-w-xs"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/8">
          <WifiOff className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Backend unreachable</h1>
          <p className="mt-1.5 text-sm text-white/40 leading-relaxed">
            Can't connect to the Phase servers. Retrying automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/25 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Checking every 15 seconds
        </div>
      </motion.div>
    </motion.div>
  );
}
