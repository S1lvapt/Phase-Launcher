"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function statusColor(status: string) {
  if (status === "WAITING FOR GAME") return "text-green-400";
  if (status === "IN PROGRESS") return "text-yellow-400";
  return "text-zinc-400";
}

function statusDot(status: string) {
  if (status === "WAITING FOR GAME") return "bg-green-400 animate-pulse";
  if (status === "IN PROGRESS") return "bg-yellow-400 animate-pulse";
  return "bg-zinc-500";
}

export function Servers() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.getGameServersStatus();
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full px-6 py-6 pb-20">
      <div className="shrink-0 mb-5">
        <h1 className="text-4xl font-bold text-white">Servers</h1>
        <p className="text-white/40 text-sm mt-1">Live game server status</p>
      </div>

      {/* Stat chips */}
      {data && (
        <div className="flex gap-3 mb-5 shrink-0">
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 min-w-[90px]">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">
              Servers
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {data.serversOnline ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 min-w-[90px]">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">
              In Match
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {data.totalPlayers ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 rounded-full border border-white border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && !data?.sessions?.length && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-8 text-center">
            <p className="text-white/40">No servers online right now.</p>
          </div>
        )}

        {!loading &&
          data?.sessions?.map((s: any) => (
            <div
              key={s.sessionId}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.04] px-5 py-3.5 transition-colors hover:bg-white/[0.07]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot(s.status)}`}
                />
                <div>
                  <p className="font-semibold text-white text-sm">{s.playlistLabel}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${statusColor(s.status)}`}>
                    {s.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{s.playerCountText}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.region}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
