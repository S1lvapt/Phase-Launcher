/**
 * Discord Rich Presence helpers.
 *
 * Every function is fire-and-forget — RPC errors are logged but never
 * bubble up to the UI, since presence is non-critical.
 */
import { invoke } from "@tauri-apps/api/core";

function call(cmd: string, args?: Record<string, unknown>) {
  invoke(cmd, args).catch((err) =>
    console.warn(`[RPC] ${cmd} failed:`, err),
  );
}

export const rpc = {
  /** After successful login / app resume with valid session. */
  inLauncher(displayName: string) {
    call("rpc_set_in_launcher", { displayName });
  },

  /** While browsing the Item Shop. */
  inShop() {
    call("rpc_set_in_shop");
  },

  /** While viewing the Leaderboard. */
  inLeaderboard() {
    call("rpc_set_in_leaderboard");
  },

  /** When the game is launched. Pass the build version string. */
  inGame(version: string) {
    call("rpc_set_in_game", { version });
  },

  /** When the game closes / user returns to the launcher home. */
  idle(displayName: string) {
    call("rpc_set_idle", { displayName });
  },

  /** On logout — clears the presence entirely. */
  clear() {
    call("rpc_clear");
  },
};
