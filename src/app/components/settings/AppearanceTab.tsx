"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { themes } from "../../styles";
import { ToggleOption } from "./ToggleOption";
import { useConfigStore } from "../../../stores/settings";

const themeSwatches: Record<string, string> = {
  obsidian: "linear-gradient(135deg, #0a0a0c, #d4d4d8)",
  white: "linear-gradient(135deg, #f2f2f4, #2563eb)",
  ocean: "linear-gradient(135deg, #071117, #38bdf8)",
  sakura: "linear-gradient(135deg, #130d11, #fb7185)",
  midnight: "linear-gradient(135deg, #0b0e18, #8ba4ff)",
  aurora: "linear-gradient(135deg, #07110f, #34d399)",
  crimson: "linear-gradient(135deg, #120909, #f87171)",
  twilight: "linear-gradient(135deg, #0f0b17, #a78bfa)",
  amethyst: "linear-gradient(135deg, #100a16, #c084fc)",
  galaxy: "linear-gradient(135deg, #0b0b17, #818cf8)",
  nebula: "linear-gradient(135deg, #0f0918, #a855f7)",
  ember: "linear-gradient(135deg, #120d09, #fb923c)",
  forest: "linear-gradient(135deg, #081009, #4ade80)",
};

const backgroundPatterns = [
  { value: "dust", label: "Dust" },
  { value: "cubes", label: "Cubes" },
  { value: "waves", label: "Waves" },
];

const themeNames = Object.keys(themes);

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AppearanceTab() {
  const config = useConfigStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Theme */}
      <Section label="Theme">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-7">
          {themeNames.map((theme, i) => {
            const active = config.theme === theme;
            return (
              <motion.button
                key={theme}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => config.setTheme(theme)}
                className={`relative flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  active
                    ? "border-white/50 bg-white/8"
                    : "border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12"
                }`}
              >
                <span
                  className="h-8 w-full rounded-lg shadow-sm"
                  style={{ background: themeSwatches[theme] }}
                />
                <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-white/40"}`}>
                  {capitalize(theme)}
                </span>
                {active && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-white flex items-center justify-center">
                    <Check size={9} strokeWidth={3} className="text-black" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </Section>

      {/* Background */}
      <Section label="Background">
        <div className="flex gap-2">
          {backgroundPatterns.map((pattern) => {
            const active = config.backgroundPattern === pattern.value;
            return (
              <button
                key={pattern.value}
                onClick={() => config.setBackgroundPattern(pattern.value)}
                className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  active
                    ? "border-white/50 bg-white/8"
                    : "border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12"
                }`}
              >
                <PatternPreview value={pattern.value} active={active} />
                <span className={`text-xs font-semibold ${active ? "text-white" : "text-white/40"}`}>
                  {pattern.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Layout */}
      <Section label="Layout">
        <div className="flex items-center justify-between gap-6 px-1">
          <div>
            <p className="text-sm font-semibold text-white">Minimize Sidebar</p>
            <p className="text-xs text-white/40 mt-0.5">Icon-only navigation bar.</p>
          </div>
          <ToggleOption
            label=""
            value={config.minimizeSidebar}
            onChange={config.setMinimizeSidebar}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/3 p-4">
      <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  );
}

function PatternPreview({ value, active }: { value: string; active: boolean }) {
  const color = active ? "var(--accent)" : "rgba(255,255,255,0.25)";
  return (
    <div className="relative h-10 w-full rounded-lg overflow-hidden bg-white/5">
      {value === "dust" && (
        <>
          {[[22, 30], [40, 64], [68, 40], [55, 74]].map(([t, l], i) => (
            <span key={i} className="absolute h-1 w-1 rounded-full" style={{ top: `${t}%`, left: `${l}%`, background: color }} />
          ))}
        </>
      )}
      {value === "cubes" && (
        <>
          {[[18, 20, 14], [52, 58, 20], [64, 22, 10]].map(([t, l, s], i) => (
            <span key={i} className="absolute rounded-sm opacity-70" style={{ top: `${t}%`, left: `${l}%`, width: s, height: s, background: color, filter: "blur(2px)" }} />
          ))}
        </>
      )}
      {value === "waves" && (
        <>
          {[[10, 15, 26], [40, 55, 32]].map(([t, l, s], i) => (
            <span key={i} className="absolute rounded-full opacity-60" style={{ top: `${t}%`, left: `${l}%`, width: s, height: s, background: color, filter: "blur(4px)" }} />
          ))}
        </>
      )}
    </div>
  );
}
