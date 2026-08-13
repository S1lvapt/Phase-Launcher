import { Heart } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { Config } from "../../../util/config";

function DiscordIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: "#818cf8", flexShrink: 0 }}
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export function SupportCards() {
  return (
    <div className="grid grid-cols-2 gap-2 shrink-0">
      <div className="support-card flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Heart size={14} className="text-rose-400 shrink-0" fill="currentColor" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Support {Config.NAME}</p>
            <p className="text-[10px] text-white/35 truncate">Help keep things running</p>
          </div>
        </div>
        <button onClick={() => open(Config.DONATE_LINK)} className="donate-button shrink-0">
          Donate
        </button>
      </div>

      <div className="support-card flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <DiscordIcon />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Join Discord</p>
            <p className="text-[10px] text-white/35 truncate">Stay up to date</p>
          </div>
        </div>
        <button onClick={() => open(Config.DISCORD_LINK)} className="discord-button shrink-0">
          Join
        </button>
      </div>
    </div>
  );
}
