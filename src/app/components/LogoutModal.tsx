"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Config } from "../../util/config";
import { useUserStore } from "../../stores/user";
import { useUIStore } from "../../stores/ui";
import { rpc } from "../../lib/rpc";

export function LogoutModal() {
  const navigate = useNavigate();
  const logout = useUserStore((state) => state.logout);
  const showLogoutModal = useUIStore((state) => state.showLogoutModal);
  const closeLogoutModal = useUIStore((state) => state.closeLogoutModal);

  return (
    <AnimatePresence>
      {showLogoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={closeLogoutModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="launcher-modal w-full max-w-[340px]"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/8">
                <LogOut size={20} className="text-red-400" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">Log out of {Config.NAME}?</h2>
                <p className="mt-1 text-sm text-white/45">You'll need to sign in again to continue.</p>
              </div>

              <div className="flex gap-2 w-full mt-1">
                <button onClick={closeLogoutModal} className="secondary-button flex-1 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => { closeLogoutModal(); rpc.clear(); logout(); navigate("/"); }}
                  className="danger-button flex-1 text-sm"
                >
                  Log Out
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
