type Config = {
  NAME: string;
  VERSION: string;
  BACKEND_URL: string;
  WEBSITE_URL: string;
  CURRENT_SEASON: number;
  CURRENT_VERSION: string;
  ALLOW_ALL_VERSIONS: boolean;
  DISCORD_LINK: string;
  LEADERBOARD_ENABLED: boolean;
  DONATE_LINK: string;
  LAUNCH_OPTIONS: {
    REDIRECT_DOWNLOAD: string;
    DOWNLOAD_PAKS: boolean;
    PAK_LINKS?: string[];
    MOBILE_PAK_URL?: string;
    MOBILE_SIG_URL?: string;
    MOBILE_BUILDS?: string[];

    DOWNLOAD_EXTRA_DLLS: boolean;
    DLL_LINKS?: string[];

    BUBBLE_BUILDS?: string[];

    EDIT_ON_RELEASE_DLL?: string;
    RESET_ON_RELEASE_DLL?: string;

    ANTICHEAT_PATH?: string;
    AC_DOWNLOAD_URL?: string;
  };
};

export const Config: Config = {
  NAME: "Phase",
  VERSION: "1.0.0",
  BACKEND_URL: "http://projectphase.pt:8064",
  // Base URL of the Phase website (Website/website.js). Used only to open
  // the "Sign in with Discord" flow in the system browser - the launcher
  // itself never embeds the OAuth2 page.
  WEBSITE_URL: "http://projectphase.pt:8080",
  CURRENT_SEASON: 19,
  CURRENT_VERSION: "19.10",
  ALLOW_ALL_VERSIONS: false,
  DISCORD_LINK: "https://discord.gg/phasefn",
  LEADERBOARD_ENABLED: true,
  DONATE_LINK: "https://discord.gg/phasefn",
  LAUNCH_OPTIONS: {
    REDIRECT_DOWNLOAD:
      "https://github.com/S1lvapt/tellrium/raw/refs/heads/main/Tellurium.dll",
    DOWNLOAD_PAKS: false,
    PAK_LINKS: [],
    MOBILE_PAK_URL: "",
    MOBILE_SIG_URL: "",
    MOBILE_BUILDS: [],
    DOWNLOAD_EXTRA_DLLS: false,
    DLL_LINKS: [],
    BUBBLE_BUILDS: [
      "https://github.com/S1lvapt/Bubble-builds-19.10/raw/refs/heads/main/z_pakchunk250-Windows_P.pak",
      "https://github.com/S1lvapt/Bubble-builds-19.10/raw/refs/heads/main/z_pakchunk250-Windows_P.sig",
      "https://github.com/S1lvapt/Bubble-builds-19.10/raw/refs/heads/main/z_pakchunk250-Windows_P.ucas",
      "https://github.com/S1lvapt/Bubble-builds-19.10/raw/refs/heads/main/z_pakchunk250-Windows_P.utoc",
    ],
    EDIT_ON_RELEASE_DLL: "https://github.com/S1lvapt/eorrorDLL/raw/refs/heads/main/EditOnReleasev2.dll",
    RESET_ON_RELEASE_DLL: "https://github.com/S1lvapt/eorrorDLL/raw/refs/heads/main/Reset%20on%20Release.dll",
    // Empty => resolved at runtime next to the launcher exe (see game.rs).
    ANTICHEAT_PATH: "",
    AC_DOWNLOAD_URL:
      "https://github.com/linoudev/CatAC/raw/main/CatAC.exe",
  },
};
