use declarative_discord_rich_presence::activity::{Activity, Assets, Timestamps};
use declarative_discord_rich_presence::DeclarativeDiscordIpcClient;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// The Discord application client ID for Phase Launcher.
// Create an application at https://discord.com/developers/applications and
// paste the numeric ID here (as a string literal).
const CLIENT_ID: &str = "1522726501387206656";

// Global singleton — Tauri commands share the same process so we keep one
// long-lived client rather than creating a new one per call.
static RPC: Lazy<Mutex<DeclarativeDiscordIpcClient>> = Lazy::new(|| {
    let mut client = DeclarativeDiscordIpcClient::new(CLIENT_ID);
    client.enable();
    Mutex::new(client)
});

/// Returns the current UNIX timestamp in seconds (used for the "elapsed" timer).
fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ─── Tauri commands ──────────────────────────────────────────────────────────

/// Called after a successful login. Shows the user's display name and a
/// "In Launcher" status.
#[tauri::command]
pub fn rpc_set_in_launcher(display_name: String) {
    let activity = Activity::new()
        .details(&format!("Logged in as {}", display_name))
        .state("In Launcher")
        .assets(
            Assets::new()
                .large_image("launcher_logo")
                .large_text("Phase Launcher"),
        )
        .timestamps(Timestamps::new().start(now_secs()));

    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.set_activity(activity);
    }
}

/// Called when the user is browsing the Item Shop.
#[tauri::command]
pub fn rpc_set_in_shop() {
    let activity = Activity::new()
        .details("Browsing the Item Shop")
        .state("In Launcher")
        .assets(
            Assets::new()
                .large_image("launcher_logo")
                .large_text("Phase Launcher")
                .small_image("shop_icon")
                .small_text("Item Shop"),
        )
        .timestamps(Timestamps::new().start(now_secs()));

    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.set_activity(activity);
    }
}

/// Called when the user is viewing the Leaderboard.
#[tauri::command]
pub fn rpc_set_in_leaderboard() {
    let activity = Activity::new()
        .details("Viewing Leaderboard")
        .state("In Launcher")
        .assets(
            Assets::new()
                .large_image("launcher_logo")
                .large_text("Phase Launcher")
                .small_image("leaderboard_icon")
                .small_text("Leaderboard"),
        )
        .timestamps(Timestamps::new().start(now_secs()));

    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.set_activity(activity);
    }
}

/// Called when the game launches.
#[tauri::command]
pub fn rpc_set_in_game(version: String) {
    let state = if version.is_empty() {
        "Playing Fortnite".to_string()
    } else {
        format!("Season {} — Playing", version)
    };

    let activity = Activity::new()
        .details("In Game")
        .state(&state)
        .assets(
            Assets::new()
                .large_image("game_icon")
                .large_text("Phase — Fortnite Private Server")
                .small_image("launcher_logo")
                .small_text("Phase Launcher"),
        )
        .timestamps(Timestamps::new().start(now_secs()));

    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.set_activity(activity);
    }
}

/// Called when the game closes or the user returns to the launcher idle state.
#[tauri::command]
pub fn rpc_set_idle(display_name: String) {
    let activity = Activity::new()
        .details(&format!("Logged in as {}", display_name))
        .state("Idle")
        .assets(
            Assets::new()
                .large_image("launcher_logo")
                .large_text("Phase Launcher"),
        )
        .timestamps(Timestamps::new().start(now_secs()));

    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.set_activity(activity);
    }
}

/// Clears the presence entirely (called on logout).
#[tauri::command]
pub fn rpc_clear() {
    if let Ok(mut rpc) = RPC.lock() {
        let _ = rpc.clear_activity();
    }
}
