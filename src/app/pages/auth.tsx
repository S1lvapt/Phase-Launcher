"use client";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { SeasonInfo } from "../../util/seasonInfo";
import { Config } from "../../util/config";
import { useUserStore } from "../../stores/user";
import { api } from "../../lib/api";
import { showToast } from "../components/toaster";
import { useVideoPreload } from "../../hooks/useVideoPreload";
import { open } from "@tauri-apps/plugin-shell";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.001-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

export function Auth() {
  const { image } = SeasonInfo(Config.CURRENT_SEASON.toString());
  const profile = useUserStore();
  const [discordLoading, setDiscordLoading] = useState(false);

  useVideoPreload("/trailer.mp4", true);

  function finishLogin(data: any) {
    profile.login({
      accountId: data.account_id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      displayName: data.displayName,
      email: null,
      password: null,
      loginMethod: "discord",
      discordAvatar: data.discordAvatar ?? null,
      discordAvatarDecoration: data.discordAvatarDecoration ?? null,
    });
    sessionStorage.setItem("justLoggedIn", "true");
    window.location.reload();
  }

  async function handleDiscordLogin() {
    setDiscordLoading(true);
    try {
      await open(`${Config.WEBSITE_URL}/login?platform=pc`);
    } catch (err: any) {
      console.error("Failed to open Discord login:", err);
      showToast.error("Couldn't open the browser. Please try again.");
      setDiscordLoading(false);
    }
  }

  async function handleExchangeCode(code: string) {
    try {
      const res = await api.loginWithExchangeCode(code);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Discord login failed");
      }
      finishLogin(res.data);
    } catch (err: any) {
      console.error("Discord login failed:", err.message);
      showToast.error(err.message || "Discord login failed. Please try again.");
    } finally {
      setDiscordLoading(false);
    }
  }

  function processDeepLink(raw: string) {
    if (!raw.startsWith("com.epicgames.fortnite://")) return;
    try {
      const queryIndex = raw.indexOf("?");
      if (queryIndex === -1) return;
      const params = new URLSearchParams(raw.slice(queryIndex + 1));
      const code = params.get("code");
      if (code) {
        setDiscordLoading(true);
        handleExchangeCode(code);
      }
    } catch (err) {
      console.error("Failed to parse deep link:", err);
    }
  }

  useEffect(() => {
    const unlistenPromise = listen<string[]>("deep-link", (event) => {
      (event.payload || []).forEach(processDeepLink);
    });

    invoke<string | null>("get_initial_deep_link")
      .then((url) => {
        if (url) processDeepLink(url);
      })
      .catch((err) => console.error("Failed to read initial deep link:", err));

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover object-center scale-105"
          src={image}
          alt="Background"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 38%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Centered card */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="w-full max-w-sm animate-[fade-slide-up_500ms_var(--ease)_both]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-black/50 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <img src="/icon.png?v=2" className="h-8 w-8 rounded-lg" draggable={false} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Welcome to {Config.NAME}
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Sign in with Discord to continue
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/55 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={handleDiscordLogin}
              disabled={discordLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-[#5865F2] py-3 text-sm font-bold text-white transition-all hover:bg-[#4752C4] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {discordLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Waiting for Discord…</span>
                </>
              ) : (
                <>
                  <DiscordIcon />
                  <span>Sign in with Discord</span>
                </>
              )}
            </button>

            {discordLoading && (
              <p className="mt-4 text-center text-xs text-white/40">
                Complete the login in your browser, then come back here.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[12px] font-medium text-white/85">
            <ShieldCheck size={13} />
            <span>Secure login powered by Discord OAuth2</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}
