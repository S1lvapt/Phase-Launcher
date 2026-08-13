/// <reference types="vite/client" />

export type ContentPagesResult = {
  battleroyalenewsv2?: {
    news: {
      motds: Array<{
        id: string;
        image: string;
        title: string;
        body: string;
        hidden: bool;
      }>;
    };
  };
};

export type Build = {
  path: string;
  splash?: string | null;
  open: boolean;
  enabled: boolean;
  excluded?: boolean;
  defenderExcluded?: boolean;
  loading?: boolean;
  version: string;
  season: string;
};

export type LibraryState = {
  build: Build[];
  addItem: (item: Build) => void;
  removeItem: (path: string) => void;
  toggleOpen: (path: string) => void;
  toggleEnabled: (path: string) => void;
  clearLibrary: () => void;
};

export type LoginMethod = "password" | "discord";

export type Profile = {
  accountId: string | null;
  displayName: string | null;
  email: string | null;
  password: string | null;
  refreshToken: string | null;
  loginMethod: LoginMethod | null;
  discordAvatar: string | null;
  discordAvatarDecoration: string | null;
  hydrated: boolean;
  setProfile: (profile: {
    accountId?: string | null;
    displayName?: string | null;
    email: string | null;
    password: string | null;
    accessToken: string;
  }) => void;
  clearProfile: () => void;
  login: (profile: {
    accountId: string;
    displayName: string;
    email: string | null;
    password: string | null;
    accessToken: string;
    refreshToken?: string | null;
    loginMethod?: LoginMethod;
    discordAvatar?: string | null;
    discordAvatarDecoration?: string | null;
  }) => void;
  logout: () => void;
  setHydrated: () => void;
  accessToken: string;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: {
    featured?: string;
    icon: string;
  };
  rarity: {
    value: string;
    displayValue: string;
  };
};

export type View = "home" | "library" | "shop" | "settings";

export type ConfigState = {
  minimizeOnLaunch: boolean;
  minimizeSidebar: boolean;
  theme: string;
  backgroundPattern: string;

  editOnRelease: boolean;
  bubbleBuilds: boolean;
  mobileBuilds: boolean;

  editAndRelease: boolean;

  resetOnRelease: boolean;
  alwaysOnTop: boolean;
  performanceMode: boolean;

  showEditOnRelease: boolean;
  showBubbleBuilds: boolean;
  showMobileBuilds: boolean;
  showResetOnRelease: boolean;
  showMinimizeOnLaunch: boolean;
  showAlwaysOnTop: boolean;
  showTrailer: boolean;

  setBubbleBuilds: (value: boolean) => void;
  setMobileBuilds: (value: boolean) => void;
  setResetOnRelease: (value: boolean) => void;
  setEditAndRelease: (value: boolean) => void;
  setEditOnRelease: (value: boolean) => void;
  setAlwaysOnTop: (value: boolean) => void;
  setPerformanceMode: (value: boolean) => void;
  setMinimizeSidebar: (value: boolean) => void;
  setMinimizeOnLaunch: (value: boolean) => void;
  toggleMinimizeOnLaunch: () => void;
  setTheme: (theme: string) => void;
  setBackgroundPattern: (pattern: string) => void;
};

export type ZynixRoomState = {
  gradientFrom: string;
  gradientTo: string;
  roleLabel: string;
  welcomeImagePath: string | null;
  welcomeImageUrl: string | null;
  setGradient: (from: string, to: string) => void;
  setRoleLabel: (label: string) => void;
  setWelcomeImage: (path: string | null, url: string | null) => void;
  reset: () => void;
};

export type Theme = {
  background: {
    primary: string;
    secondary: string;
  };

  text: {
    primary: string;
    secondary: string;
  };

  button: {
    base: string;
    hover: string;
    active: string;
  };

  border: string;

  gradient: {
    from: string;
    to: string;
  };
};
