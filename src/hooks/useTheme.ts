import { themes } from "../app/styles";
import { useConfigStore } from "../stores/settings";
import { useEffect, useMemo } from "react";

type ThemeName = keyof typeof themes;

export function useTheme() {
  const { theme: themeName, setTheme: setThemeStore } = useConfigStore();

  const current = useMemo(() => {
    const name = themeName as ThemeName;
    return themes[name] || themes.obsidian;
  }, [themeName]);

  useEffect(() => {
    const palettes: Record<
      string,
      {
        accent: string;
        accentText: string;
        surface: string;
        surfaceSoft: string;
        sidebar: string;
        frame: string;
        textStrong?: string;
        textMuted?: string;
        border?: string;
      }
    > = {
      obsidian: {
        accent: "#d4d4d8",
        accentText: "#09090b",
        surface: "#0a0a0c",
        surfaceSoft: "#121215",
        sidebar: "#18181b",
        frame: "#151518",
      },
      white: {
        accent: "#2563eb",
        accentText: "#ffffff",
        surface: "#f2f2f4",
        surfaceSoft: "#ffffff",
        sidebar: "#ffffff",
        frame: "#ffffff",
        textStrong: "#18181b",
        textMuted: "#6b6b73",
        border: "rgba(0, 0, 0, 0.1)",
      },
      ocean: {
        accent: "#38bdf8",
        accentText: "#061018",
        surface: "#071117",
        surfaceSoft: "#0d1c24",
        sidebar: "#11242e",
        frame: "#0e1d25",
      },
      sakura: {
        accent: "#fb7185",
        accentText: "#fff7f8",
        surface: "#130d11",
        surfaceSoft: "#20151c",
        sidebar: "#241820",
        frame: "#1d141a",
      },
      midnight: {
        accent: "#8ba4ff",
        accentText: "#07101f",
        surface: "#0b0e18",
        surfaceSoft: "#121625",
        sidebar: "#171c2d",
        frame: "#131827",
      },
      aurora: {
        accent: "#34d399",
        accentText: "#06140f",
        surface: "#07110f",
        surfaceSoft: "#0d1d19",
        sidebar: "#122620",
        frame: "#0f1f1b",
      },
      crimson: {
        accent: "#f87171",
        accentText: "#fff7f7",
        surface: "#120909",
        surfaceSoft: "#1f1010",
        sidebar: "#251414",
        frame: "#1d1010",
      },
      twilight: {
        accent: "#a78bfa",
        accentText: "#12091f",
        surface: "#0f0b17",
        surfaceSoft: "#191225",
        sidebar: "#20182e",
        frame: "#1a1427",
      },
      amethyst: {
        accent: "#c084fc",
        accentText: "#16091f",
        surface: "#100a16",
        surfaceSoft: "#1b1024",
        sidebar: "#21152d",
        frame: "#1b1225",
      },
      galaxy: {
        accent: "#818cf8",
        accentText: "#080b1f",
        surface: "#0b0b17",
        surfaceSoft: "#141426",
        sidebar: "#1a1a31",
        frame: "#15152a",
      },
      nebula: {
        accent: "#a855f7",
        accentText: "#fff7ff",
        surface: "#0f0918",
        surfaceSoft: "#1a1027",
        sidebar: "#211632",
        frame: "#1a1128",
      },
      ember: {
        accent: "#fb923c",
        accentText: "#160b03",
        surface: "#120d09",
        surfaceSoft: "#20170f",
        sidebar: "#261b12",
        frame: "#1f160f",
      },
      forest: {
        accent: "#4ade80",
        accentText: "#041107",
        surface: "#081009",
        surfaceSoft: "#0f1c11",
        sidebar: "#142416",
        frame: "#101d12",
      },
    };
    const palette = palettes[themeName] ?? palettes.obsidian;

    document.documentElement.style.setProperty("--accent", palette.accent);
    document.documentElement.style.setProperty("--accent-text", palette.accentText);
    document.documentElement.style.setProperty("--accent-soft", `${palette.accent}24`);
    document.documentElement.style.setProperty("--surface", palette.surface);
    document.documentElement.style.setProperty("--surface-soft", palette.surfaceSoft);
    document.documentElement.style.setProperty("--sidebar-bg", palette.sidebar);
    document.documentElement.style.setProperty("--frame-bg", palette.frame);
    document.documentElement.style.setProperty("--text-strong", palette.textStrong ?? "#f4f4f5");
    document.documentElement.style.setProperty("--text-muted", palette.textMuted ?? "#a1a1aa");
    document.documentElement.style.setProperty("--border", palette.border ?? "rgba(255, 255, 255, 0.1)");
    document.documentElement.style.setProperty(
      "--surface-raised",
      themeName === "white" ? "rgba(0, 0, 0, 0.035)" : "rgba(255, 255, 255, 0.05)",
    );
    document.documentElement.dataset.themeChanging = "true";

    const timer = window.setTimeout(() => {
      delete document.documentElement.dataset.themeChanging;
    }, 520);

    return () => window.clearTimeout(timer);
  }, [themeName]);

  const setTheme = (name: ThemeName) => {
    if (themes[name]) {
      setThemeStore(name);
    }
  };

  return {
    current,
    themeName: themeName as ThemeName,
    setTheme,
    themes,
  };
}
