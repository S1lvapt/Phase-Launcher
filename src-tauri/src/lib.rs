use crate::modules::game;
use crate::modules::settings;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

mod modules;
mod utilities;

#[tauri::command]
async fn check_file_exists(path: &str) -> Result<bool, String> {
    let file_path = std::path::PathBuf::from(path);

    if !file_path.exists() {
        return Ok(false);
    }

    Ok(true)
}

#[tauri::command]
async fn file_exists(file_path: String) -> Result<bool, String> {
    let file_path = Path::new(&file_path);
    Ok(file_path.exists())
}

#[tauri::command]
async fn delete_file(file_path: String) -> Result<bool, String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    if path.is_dir() {
        return Err(format!("Path is a directory, not a file: {}", file_path));
    }

    fs::remove_file(path).map_err(|e| format!("Failed to delete file '{}': {}", file_path, e))?;

    Ok(true)
}

#[tauri::command]
fn get_directory_size(path: String) -> Result<u64, String> {
    fn dir_size(path: &PathBuf) -> Result<u64, String> {
        let mut size = 0;
        if path.is_dir() {
            for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.is_dir() {
                    size += dir_size(&path)?;
                } else {
                    size += fs::metadata(&path).map_err(|e| e.to_string())?.len();
                }
            }
        } else if path.is_file() {
            size += fs::metadata(path).map_err(|e| e.to_string())?.len();
        }
        Ok(size)
    }

    dir_size(&PathBuf::from(path))
}

#[tauri::command]
fn locate_version(file_path: &str) -> Result<Vec<String>, String> {
    let file_contents = fs::read(file_path)
        .map_err(|error| format!("Failed to read file '{}': {}", file_path, error))?;

    const VERSION_SIGNATURE: &[u8] = &[
        0x2b, 0x00, 0x2b, 0x00, 0x46, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x74, 0x00, 0x6e, 0x00, 0x69,
        0x00, 0x74, 0x00, 0x65, 0x00, 0x2b, 0x00,
    ];

    let mut version_strings = Vec::new();
    let signature_len = VERSION_SIGNATURE.len();

    for match_pos in find_pattern_positions(&file_contents, VERSION_SIGNATURE) {
        if let Some(version_text) = extract_version_string(&file_contents, match_pos, signature_len)
        {
            version_strings.push(version_text);
        }
    }

    Ok(version_strings)
}

fn find_pattern_positions(haystack: &[u8], needle: &[u8]) -> Vec<usize> {
    haystack
        .windows(needle.len())
        .enumerate()
        .filter_map(
            |(idx, window)| {
                if window == needle {
                    Some(idx)
                } else {
                    None
                }
            },
        )
        .collect()
}

fn extract_version_string(
    buffer: &[u8],
    pattern_start: usize,
    pattern_len: usize,
) -> Option<String> {
    const SEARCH_RANGE: usize = 64;

    let text_start = pattern_start;
    let search_end = (pattern_start + pattern_len + SEARCH_RANGE).min(buffer.len());

    let string_end = locate_string_terminator(&buffer[pattern_start + pattern_len..search_end])?;
    let total_length = pattern_len + string_end;

    if total_length % 2 != 0 {
        return None;
    }

    let utf16_data: Vec<u16> = buffer[text_start..text_start + total_length]
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect();

    let decoded_string = String::from_utf16_lossy(&utf16_data);
    Some(decoded_string.trim_matches('\0').trim().to_string())
}

fn locate_string_terminator(data: &[u8]) -> Option<usize> {
    data.chunks_exact(2)
        .position(|chunk| chunk == [0x00, 0x00])
        .map(|pos| pos * 2)
        .or_else(|| Some(data.len().min(64)))
}

#[tauri::command]
fn is_fn_running() -> bool {
    utilities::any_fortnite_proc_running()
}

#[tauri::command]
fn get_initial_deep_link(app: tauri::AppHandle) -> Option<String> {
    // Called once by the frontend on mount. Covers the cold-start case
    // (com.epicgames.fortnite:// link launched the app fresh) reliably,
    // since app.emit() during .setup() can otherwise fire before the
    // React side has had a chance to attach its event listener.
    app.deep_link()
        .get_current()
        .ok()
        .flatten()
        .and_then(|urls| urls.into_iter().next())
        .map(|u| u.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // On Windows/Linux, clicking a com.epicgames.fortnite:// link
            // while the launcher is already open starts a *new* process by
            // default. This plugin intercepts that second launch, so we can
            // hand its argv (which contains the clicked URL) to the window
            // that's already open instead, and bring it to the front.
            let urls: Vec<String> = argv
                .into_iter()
                .filter(|a| a.starts_with("com.epicgames.fortnite://"))
                .collect();

            if !urls.is_empty() {
                let _ = app.emit("deep-link", urls);
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Installers register the com.epicgames.fortnite:// scheme via
            // the "plugins.deep-link.desktop.schemes" config on install, but
            // that doesn't happen during `tauri dev`. Register it here too
            // so the link still works while developing.
            #[cfg(debug_assertions)]
            {
                if let Err(e) = app.deep_link().register("com.epicgames.fortnite") {
                    log::warn!("Failed to register dev deep link scheme: {e}");
                }
            }

            // Forward the com.epicgames.fortnite:// URL used by the Discord
            // OAuth2 "sign in with Discord" flow (Website/Data/html/accountExists.html)
            // to the frontend while the app is already running. Cold-start
            // launches (app not running yet) are handled separately by the
            // get_initial_deep_link command below, which the frontend calls
            // once on mount instead of relying on this event having a
            // listener attached in time.
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls: Vec<String> = event.urls().iter().map(|u| u.to_string()).collect();
                if !urls.is_empty() {
                    let _ = handle.emit("deep-link", urls);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_initial_deep_link,
            check_file_exists,
            file_exists,
            locate_version,
            get_directory_size,
            delete_file,
            is_fn_running,
            modules::exclude::add_defender_exclusion,
            game::launch_game,
            game::close_game,
            game::check_paks_needed,
            settings::set_always_on_top,
            modules::build_download::download_build,
            modules::build_download::cancel_build_download,
            modules::build_download::extract_build,
            modules::build_download::find_fortnite_game_root,
            modules::discord_rpc::rpc_set_in_launcher,
            modules::discord_rpc::rpc_set_in_shop,
            modules::discord_rpc::rpc_set_in_leaderboard,
            modules::discord_rpc::rpc_set_in_game,
            modules::discord_rpc::rpc_set_idle,
            modules::discord_rpc::rpc_clear,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
