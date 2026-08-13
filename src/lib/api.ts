import { endpoints } from "./http/endpoints";
import { request } from "./http/client";
import { ContentPagesResult } from "../vite-env";

export const api = {
  getContentPages: () =>
    request<ContentPagesResult>({ url: endpoints.contentPages }),

  getShopCatalog: () => request<any>({ url: endpoints.shopCatalog }),

  login: (email: string, password: string) =>
    request<any>({
      url: endpoints.login,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${email}:${password}`)}`,
      },
      data: `grant_type=password&username=${email}&password=${password}`,
    }),

  // Used to finish a "Sign in with Discord" flow: the website generates a
  // short-lived exchange code and hands it to the launcher via deep link
  // (com.epicgames.fortnite://authorize/?code=...), which is then traded
  // in here for a normal access/refresh token pair, same as email+password.
  loginWithExchangeCode: (code: string) =>
    request<any>({
      url: endpoints.login,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa("launcher:discord")}`,
      },
      data: `grant_type=exchange_code&exchange_code=${encodeURIComponent(code)}`,
    }),

  // Re-issues an access token from a stored refresh token, without needing
  // the original email/password (needed for Discord-based sessions, but
  // used for every login method on app startup).
  refreshLogin: (refreshToken: string) =>
    request<any>({
      url: endpoints.login,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa("launcher:refresh")}`,
      },
      data: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    }),

  postQueryProfile: (
    accountId: string,
    profileId: "athena" | "common_core",
    token: string,
    rvn: number = -1,
  ) =>
    request<any>({
      url: `${endpoints.queryProfile}/${accountId}/client/QueryProfile`,
      method: "POST",
      params: { profileId, rvn },
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),

  getStatsV2Leaderboard: (leaderboardName: string, maxSize: number = 100) =>
    request<{
      maxSize: number;
      entries: {
        displayName: string;
        account: string;
        value: number;
      }[];
    }>({
      url: `${endpoints.statsV2Leaderboard}/${leaderboardName}`,
      params: { maxSize },
    }),

  postGlobalLeaderboard: (
    leaderboardName: string,
    window: "alltime" | "weekly" | "daily" = "alltime",
  ) =>
    request<{
      statName: string;
      statWindow: string;
      entries: {
        accountId: string;
        displayName: string;
        rank: number;
        value: number;
      }[];
    }>({
      url: `${endpoints.globalLeaderboard}/${leaderboardName}/window/${window}`,
      method: "POST",
    }),

  getPaks: () =>
    request<
      {
        name: string;
        size: number;
      }[]
    >({ url: endpoints.paks }),

  getVbucksClaimStatus: (token: string) =>
    request<{
      canClaim: boolean;
      msLeft: number;
      nextClaimAt?: string;
    }>({
      url: endpoints.vbucksClaimStatus,
      headers: {
        Authorization: `bearer ${token}`,
      },
    }),

  claimVbucks: (token: string) =>
    request<{
      claimed: number;
      newQuantityCommonCore: number;
      nextClaimAt: string;
    }>({
      url: endpoints.claimVbucks,
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
      },
    }),

  getGameServersStatus: () =>
    request<any>({ url: endpoints.gameServersStatus }),
};
