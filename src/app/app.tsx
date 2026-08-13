import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

import { Auth } from "./pages/auth";
import { Home } from "./pages/home";
import { Library } from "./pages/library";
import { Settings } from "./pages/settings";
import { Shop } from "./pages/shop";
import { ZynixRoom } from "./pages/zynix-room";

import "./styles/app.css";
import { Frame } from "./components/frame";
import { Sidebar } from "./components/sidebar";
import { CustomToaster } from "./components/toaster";
import { useTheme } from "../hooks/useTheme";
import { Leaderboard } from "./pages/leaderboard";
import { Servers } from "./pages/servers";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { ServerOffline } from "./components/ServerOffline";
import { useEffect } from "react";
import { api } from "../lib/api";
import { useUserStore } from "../stores/user";
import { useProfileStore } from "../stores/profile";
import { useOnboarding } from "../hooks/useOnboarding";
import { useGameWatcher } from "../hooks/useGameWatcher";
import { OnboardingModal } from "./components/onboarding/OnboardingModal";
import { LogoutModal } from "./components/LogoutModal";
import { useConfigStore } from "../stores/settings";
import { BackgroundPattern } from "./components/BackgroundPattern";
import { IntroTrailer } from "./components/IntroTrailer";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { useState } from "react";
import { rpc } from "../lib/rpc";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/zynix-room" element={<ZynixRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const auth = useAuth.user();
  const profile = useUserStore();
  const colors = useTheme();
  const onboarding = useOnboarding();
  useGameWatcher();
  const { online, checking } = useBackendHealth();
  const backgroundPattern = useConfigStore((state) => state.backgroundPattern);
  const showTrailerSetting = useConfigStore((state) => state.showTrailer);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("justLoggedIn") === "true";
  });
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!auth.hydrated) return;
    if (!auth.isValidSession()) return;
    if (showIntro && showTrailerSetting) return;

    setShowWelcome(true);
  }, [auth.hydrated]);

  if (!auth.hydrated) {
    return null;
  }

  async function AttemptLogin() {
    const email = profile.email;
    const password = profile.password;
    const refreshToken = profile.refreshToken;

    // Prefer the refresh token: it works for every login method (password
    // or Discord), whereas email/password is only ever set for accounts
    // that logged in manually.
    if (refreshToken) {
      const refreshRes = await api.refreshLogin(refreshToken);
      if (refreshRes.success && refreshRes.data) {
        profile.login({
          accountId: refreshRes.data.account_id,
          accessToken: refreshRes.data.access_token,
          refreshToken: refreshRes.data.refresh_token,
          displayName: refreshRes.data.displayName,
          email,
          password,
          loginMethod: profile.loginMethod ?? "password",
          discordAvatar: refreshRes.data.discordAvatar ?? profile.discordAvatar,
          discordAvatarDecoration:
            refreshRes.data.discordAvatarDecoration ?? profile.discordAvatarDecoration,
        });
        return;
      }
    }

    if (!email || !password) {
      return;
    }

    const res = await api.login(email, password);
    if (!res.success || !res.data) {
      throw new Error(res.error || "Login failed");
    }
    profile.login({
      accountId: res.data.account_id,
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      displayName: res.data.displayName,
      email,
      password,
      loginMethod: "password",
    });
  }

  useEffect(() => {
    if (!auth.isValidSession()) return;

    if (auth.accountId) {
      AttemptLogin().catch(() => {});
    }

    if (auth.accessToken && auth.accountId) {
      useProfileStore.getState().fetchProfile(auth.accountId, "athena", auth.accessToken).catch(() => {});
      useProfileStore.getState().fetchProfile(auth.accountId, "common_core", auth.accessToken).catch(() => {});
    }

    if (auth.displayName) {
      rpc.inLauncher(auth.displayName);
    }
  }, []);

  return (
    <div className="w-full h-full overflow-hidden">
      {!checking && !online && <ServerOffline />}
      <BrowserRouter>
        <Frame />
        {!auth.isValidSession() ? (
          <Routes>
            <Route path="*" element={<Auth />} />
          </Routes>
        ) : (
          <>
            <Sidebar />
            <main
              className={`fixed top-8 left-0 right-0 bottom-0 overflow-hidden ${colors.current.background.secondary} app-surface`}
              data-bg-pattern={backgroundPattern}
              style={{
                "--content-left": "0px",
              } as React.CSSProperties}
            >
              <BackgroundPattern />
              <AnimatedRoutes />
            </main>
            <OnboardingModal
              open={onboarding.shouldShow}
              onComplete={onboarding.complete}
            />
            <LogoutModal />
            <WelcomeSplash
              visible={showWelcome}
              onFinish={() => setShowWelcome(false)}
            />
            {showIntro && showTrailerSetting && (
              <IntroTrailer
                onFinish={() => {
                  sessionStorage.removeItem("justLoggedIn");
                  setShowIntro(false);
                  setShowWelcome(true);
                }}
              />
            )}
          </>
        )}
        <CustomToaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
