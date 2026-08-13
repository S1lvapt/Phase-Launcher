import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Gift, Loader2, User } from "lucide-react";
import { useServerStatus } from "../../../hooks/useServerStatus";
import { useProfileStore } from "../../../stores/profile";
import { useUserStore } from "../../../stores/user";
import { useZynixRoomStore } from "../../../stores/zynixRoom";
import { useOwnerMode } from "../../../hooks/useOwnerMode";
import { api } from "../../../lib/api";
import { showToast } from "../toaster";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatTimeLeft(ms: number) {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Avatar() {
  const loginMethod = useUserStore((s) => s.loginMethod);
  const discordAvatar = useUserStore((s) => s.discordAvatar);
  const discordAvatarDecoration = useUserStore((s) => s.discordAvatarDecoration);
  const displayName = useUserStore((s) => s.displayName);
  const favoriteCharacter = useProfileStore((s) => s.getFavoriteCharacter()) || "cid_001_athena_commando_f_default";
  const isOwner = useOwnerMode();
  const welcomeImageUrl = useZynixRoomStore((s) => s.welcomeImageUrl);

  const useDiscordAvatar = loginMethod === "discord" && !!discordAvatar;
  const src = isOwner && welcomeImageUrl ? welcomeImageUrl : useDiscordAvatar ? discordAvatar! : `https://fortnite-api.com/images/cosmetics/br/${favoriteCharacter.toLowerCase()}/icon.png`;

  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => { setFailed(false); setRetry(0); }, [src]);

  if (failed) {
    return (
      <div className="h-9 w-9 rounded-lg shrink-0 bg-white/8 flex items-center justify-center">
        <User size={16} className="text-white/40" />
      </div>
    );
  }

  const imgSrc = retry > 0 ? `${src}${src.includes("?") ? "&" : "?"}r=${retry}` : src;

  if (useDiscordAvatar || (isOwner && welcomeImageUrl)) {
    return (
      <div className="relative h-9 w-9 shrink-0">
        <img src={imgSrc} alt="" className="h-full w-full rounded-full object-cover" draggable={false}
          onError={() => retry < 2 ? setTimeout(() => setRetry(r => r + 1), 800) : setFailed(true)} />
        {discordAvatarDecoration && (
          <img src={discordAvatarDecoration} alt="" className="pointer-events-none absolute inset-0 scale-105" draggable={false} />
        )}
      </div>
    );
  }

  return (
    <img src={imgSrc} alt={displayName || ""} className="h-9 w-9 rounded-lg object-cover shrink-0" draggable={false}
      onError={() => retry < 2 ? setTimeout(() => setRetry(r => r + 1), 800) : setFailed(true)} />
  );
}

function StatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2.5 rounded-xl px-3 h-13 ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

function AccountCard() {
  const displayName = useUserStore((s) => s.displayName);
  const isOwner = useOwnerMode();
  const gradientFrom = useZynixRoomStore((s) => s.gradientFrom);
  const gradientTo = useZynixRoomStore((s) => s.gradientTo);
  const roleLabel = useZynixRoomStore((s) => s.roleLabel);

  return (
    <StatCard className="account-card">
      <Avatar />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] text-white/40 font-medium">Account</span>
        <span className="text-sm font-semibold truncate flex items-center gap-1.5">
          {isOwner ? (
            <span style={{ background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {displayName}
            </span>
          ) : displayName}
          {isOwner && roleLabel && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`, color: "#fff" }}>
              {roleLabel}
            </span>
          )}
        </span>
      </div>
    </StatCard>
  );
}

function TierCard() {
  const tier = useProfileStore((s) => s.profiles?.athena?.stats?.attributes?.level) ?? 0;
  return (
    <StatCard className="bp-card">
      <img src="/battlepass_premium.png" className="h-8 w-8 shrink-0" draggable={false} />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] text-white/40 font-medium">Battle Pass</span>
        <span className="text-sm font-semibold">Tier {tier.toLocaleString()}</span>
      </div>
    </StatCard>
  );
}

function VbucksCard() {
  const vbucks = useProfileStore((s) => s.profiles?.common_core?.items?.["Currency:MtxPurchased"]?.quantity) ?? 0;
  const accountId = useUserStore((s) => s.accountId);
  const accessToken = useUserStore((s) => s.accessToken);
  const [canClaim, setCanClaim] = useState(false);
  const [msLeft, setMsLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    let retryT: ReturnType<typeof setTimeout> | null = null;
    async function check(attempt = 0) {
      const res = await api.getVbucksClaimStatus(accessToken as string);
      if (cancelled) return;
      if (!res.success || !res.data) {
        retryT = setTimeout(() => check(attempt + 1), Math.min(5000 * 2 ** attempt, 60000));
        return;
      }
      setCanClaim(res.data.canClaim);
      setMsLeft(res.data.msLeft);
      setChecked(true);
    }
    check();
    return () => { cancelled = true; if (retryT) clearTimeout(retryT); };
  }, [accessToken]);

  useEffect(() => {
    if (canClaim || msLeft <= 0) return;
    const id = setInterval(() => {
      setMsLeft(prev => {
        const next = prev - 1000;
        if (next <= 0) { setCanClaim(true); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [canClaim, msLeft]);

  async function handleClaim(e: React.MouseEvent) {
    e.stopPropagation();
    if (!accessToken || !canClaim || claiming) return;
    setClaiming(true);
    try {
      const res = await api.claimVbucks(accessToken);
      if (!res.success || !res.data) { showToast.error(res.error || "Failed to claim V-Bucks."); return; }
      showToast.success(`Claimed ${res.data.claimed} V-Bucks!`);
      setCanClaim(false);
      setMsLeft(24 * 60 * 60 * 1000);
      if (accountId) await useProfileStore.getState().fetchProfile(accountId, "common_core", accessToken);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to claim.");
    } finally { setClaiming(false); }
  }

  return (
    <StatCard className="vb-card">
      <img src="/fortnite-v-bucks.png" alt="V-Bucks" className="h-9 w-9 shrink-0" draggable={false} />
      <div className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-[10px] text-white/40 font-medium">V-Bucks</span>
        <span className="text-sm font-semibold">{vbucks.toLocaleString()}</span>
      </div>
      {checked && (
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          title={canClaim ? "Claim daily V-Bucks" : `Next claim in ${formatTimeLeft(msLeft)}`}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
            canClaim ? "bg-white/15 text-white hover:bg-white/22" : "bg-white/6 text-white/35 cursor-not-allowed"
          }`}
        >
          {claiming ? <Loader2 size={11} className="animate-spin" /> : <Gift size={11} />}
          {claiming ? "" : canClaim ? "Claim" : formatTimeLeft(msLeft)}
        </button>
      )}
    </StatCard>
  );
}

export function ProfileCardsRow() {
  const displayName = useUserStore((s) => s.displayName);
  const serverStatus = useServerStatus();

  return (
    <div className="flex flex-col gap-2.5 shrink-0">
      <div className="flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="text-2xl font-bold text-white"
        >
          {getGreeting()}, {displayName}
        </motion.p>

        {serverStatus !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1"
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${(serverStatus.playersOnline ?? 0) > 0 ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-xs font-medium text-white/50">{serverStatus.playersOnline ?? 0} online</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <AccountCard />
        <TierCard />
        <VbucksCard />
      </div>
    </div>
  );
}
