"use client";

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Config } from "../../../util/config";
import { useUserStore } from "../../../stores/user";
import { useUIStore } from "../../../stores/ui";
import { useProfileStore } from "../../../stores/profile";

export function InformationTab() {
  const user = useUserStore.getState();
  const openLogoutModal = useUIStore((state) => state.openLogoutModal);
  const [iconFailed, setIconFailed] = useState(false);

  const favoriteCharacter =
    useProfileStore((s) => s.getFavoriteCharacter()) ||
    "cid_001_athena_commando_f_default";

  const iconUrl = `https://fortnite-api.com/images/cosmetics/br/${favoriteCharacter.toLowerCase()}/icon.png`;
  const useDiscordAvatar = user.loginMethod === "discord" && !!user.discordAvatar;

  return (
    <div className="flex flex-col gap-2">
      {/* Account row */}
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-white/6 bg-white/3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="relative h-10 w-10 shrink-0">
            {iconFailed ? (
              <div className="h-10 w-10 rounded-xl bg-white/8 flex items-center justify-center">
                <User size={18} className="text-white/40" />
              </div>
            ) : useDiscordAvatar ? (
              <>
                <img
                  src={user.discordAvatar as string}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setIconFailed(true)}
                />
                {user.discordAvatarDecoration && (
                  <img
                    src={user.discordAvatarDecoration}
                    alt=""
                    className="pointer-events-none absolute inset-0 scale-105"
                  />
                )}
              </>
            ) : (
              <img
                src={iconUrl}
                alt=""
                className="h-10 w-10 rounded-xl object-cover"
                onError={() => setIconFailed(true)}
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
            <p className="text-xs text-white/35 truncate">{user.accountId}</p>
          </div>
        </div>

        <button
          onClick={openLogoutModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/18 transition-colors shrink-0"
        >
          <LogOut size={13} />
          Log Out
        </button>
      </div>

      {/* App row */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/6 bg-white/3">
        <img src="/icon.png?v=2" alt="" className="h-10 w-10 rounded-xl shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">{Config.NAME}</p>
          <p className="text-xs text-white/35">Version {Config.VERSION}</p>
        </div>
      </div>
    </div>
  );
}
