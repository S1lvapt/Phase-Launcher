export const endpoints = {
  contentPages: "/content/api/pages/fortnite-game",
  shopCatalog: "/fortnite/api/storefront/v2/catalog",
  login: "/account/api/oauth/token",
  queryProfile: "/fortnite/api/game/v2/profile",
  statsV2Leaderboard: "/fortnite/api/statsv2/leaderboards",
  globalLeaderboard: "/fortnite/api/leaderboards/type/global/stat",
  paks: "/api/launcher/paks",
  claimVbucks: "/api/launcher/vbucks/claim",
  vbucksClaimStatus: "/api/launcher/vbucks/status",
  gameServersStatus: "/api/gameservers/status",
} as const;
