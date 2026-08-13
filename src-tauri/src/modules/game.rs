use std::ffi::{CString, OsStr, OsString};
use std::mem::zeroed;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use tauri::Emitter;
use tauri::Window;
use tokio::io::AsyncWriteExt;
use futures_util::StreamExt;

use crate::utilities;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct PakFile {
    pub name: String,
    pub size: u64,
}

const CREATE_NO_WINDOW: u32 = 0x08000000;

// ─── Async HTTP helpers ───────────────────────────────────────────────────────

async fn get_remote_file_size(url: &str) -> Option<u64> {
    let client = reqwest::Client::new();
    let resp = client.head(url).send().await.ok()?;
    resp.headers()
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
}

/// Returns true if the local file already matches the remote size — skip download.
async fn should_skip(local: &Path, url: &str) -> bool {
    if !local.exists() {
        return false;
    }
    let local_size = tokio::fs::metadata(local).await.map(|m| m.len()).unwrap_or(0);
    match get_remote_file_size(url).await {
        Some(remote) => local_size == remote,
        None => false,
    }
}

/// Download with real streaming progress.  Emits `download-progress` events.
async fn download_with_progress(
    window: &Window,
    url: &str,
    dest: &Path,
    event_type: &str,
    name: &str,
) -> Result<(), String> {
    let _ = window.emit(
        "download-progress",
        serde_json::json!({ "type": event_type, "file": name, "progress": 0 }),
    );

    let resp = reqwest::Client::new()
        .get(url)
        .send()
        .await
        .map_err(|e| format!("GET {}: {}", url, e))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {} for {}", resp.status(), url));
    }

    let total = resp
        .headers()
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok());

    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("mkdir: {}", e))?;
    }

    let mut file = tokio::fs::File::create(dest)
        .await
        .map_err(|e| format!("create {}: {}", dest.display(), e))?;

    let mut downloaded: u64 = 0;
    let mut last_pct: f64 = -1.0;
    let mut stream = resp.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("stream: {}", e))?;
        file.write_all(&chunk).await.map_err(|e| format!("write: {}", e))?;
        downloaded += chunk.len() as u64;

        let pct = match total {
            Some(t) if t > 0 => (downloaded as f64 / t as f64 * 100.0).min(100.0),
            _ => ((downloaded / 1_048_576) as f64).min(99.0),
        };

        if pct - last_pct >= 0.5 {
            last_pct = pct;
            let _ = window.emit(
                "download-progress",
                serde_json::json!({ "type": event_type, "file": name, "progress": pct }),
            );
        }
    }

    file.flush().await.map_err(|e| format!("flush: {}", e))?;

    let _ = window.emit(
        "download-progress",
        serde_json::json!({ "type": event_type, "file": name, "progress": 100 }),
    );

    Ok(())
}

// ─── check_paks_needed ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn check_paks_needed(
    file_path: String,
    use_custom_paks: bool,
    custom_paks_links: Vec<String>,
    pak_files_whitelist: Vec<PakFile>,
) -> Result<bool, String> {
    let game_path = PathBuf::from(&file_path);
    let game_dir = game_path
        .parent()
        .and_then(|p| p.parent())
        .ok_or("Invalid game path")?
        .to_path_buf();

    // Redirect DLL present?
    let dll_path = utilities::handle_game_dll_path(&game_dir);
    if !dll_path.exists() {
        return Ok(true);
    }

    if use_custom_paks && !custom_paks_links.is_empty() {
        let paks_dir = game_path
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .ok_or("Invalid game path")?
            .join("Content")
            .join("Paks");

        for link in &custom_paks_links {
            let link = link.trim();
            if link.is_empty() { continue; }
            let clean = link.split('?').next().unwrap_or(link);
            let fname = clean.rsplit('/').next().unwrap_or("file");
            let dest = paks_dir.join(fname);
            if !should_skip(&dest, link).await {
                return Ok(true);
            }
        }
    }

    // Size-mismatch in whitelist?
    if !pak_files_whitelist.is_empty() {
        let paks_dir = game_path
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .ok_or("Invalid game path")?
            .join("Content")
            .join("Paks");

        if let Ok(mut rd) = tokio::fs::read_dir(&paks_dir).await {
            while let Ok(Some(entry)) = rd.next_entry().await {
                let p = entry.path();
                let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                if ext != "pak" && ext != "sig" { continue; }
                let fname = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if let Some(info) = pak_files_whitelist.iter().find(|i| i.name == fname) {
                    let sz = tokio::fs::metadata(&p).await.map(|m| m.len()).unwrap_or(0);
                    if sz != info.size { return Ok(true); }
                }
            }
        }
    }

    Ok(false)
}

// Returns the Win64 directory given the FortniteGame directory.
fn win64_for_reset(game_dir: &Path) -> PathBuf {
    game_dir.join("Win64")
}

/// Launches the anti-cheat and waits for it to report the game PID through a
/// result file. The AC creates the game process suspended, adopts it as its own
/// child and randomizes its image name. Spawned via CreateProcess (not
/// ShellExecute) so the `--game "..." --args "..."` quoting is preserved.
fn spawn_ac_and_get_pid(ac_path: &str, args: &[String], result_file: &Path) -> Result<u32, String> {
    use std::process::Command;
    use std::time::Duration;

    let status = Command::new(ac_path)
        .args(args)
        .creation_flags(winapi::um::winbase::CREATE_NO_WINDOW)
        .spawn();

    if let Err(error) = status {
        return Err(format!(
            "Failed to launch the anti-cheat ({}). \
             Make sure it exists at the configured ANTICHEAT_PATH.",
            error
        ));
    }

    // The AC must copy the exe under a random name, spawn the game suspended,
    // then resume it — so allow it a generous window before failing.
    for _ in 0..80 {
        if result_file.exists() {
            match std::fs::read_to_string(result_file) {
                Ok(content) => {
                    if content.starts_with("error=") {
                        return Err(format!("Anti-cheat reported an error: {}", content));
                    }
                    let pid = content
                        .lines()
                        .find_map(|line| line.strip_prefix("pid="))
                        .and_then(|v| v.trim().parse::<u32>().ok())
                        .unwrap_or(0);
                    if pid != 0 {
                        return Ok(pid);
                    }
                }
                Err(_) => {}
            }
        }
        std::thread::sleep(Duration::from_millis(500));
    }

    Err("Timed out waiting for the anti-cheat to start the game.".into())
}

// ─── launch_game ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn launch_game(
    window: Window,
    file_path: String,
    auth_login: String,
    auth_password: String,
    redirect_link: String,
    reset_on_release_dll: String,
    edit_on_release_dll: String,
    backend: String,
    inject_extra_dlls: bool,
    extra_dll_links: Vec<String>,
    use_custom_paks: bool,
    custom_paks_links: Vec<String>,
    extra_dll_options: Vec<std::collections::HashMap<String, String>>,
    pak_files_whitelist: Vec<PakFile>,
    ac_path: String,
    ac_download_url: String,
    performance_mode: bool,
) -> Result<bool, String> {

    // ── Kill existing game processes (blocking, off tokio runtime) ─────────
    let _ = tokio::task::spawn_blocking(utilities::kill_all_procs).await;

    let ac_path = ac_path.trim().to_string();
    let ac_download_url = ac_download_url.trim().to_string();

    let ac_path = if ac_path.is_empty() {
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("CatAC.exe")))
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default()
    } else {
        ac_path
    };
    let ac_download_url = ac_download_url;

    let ac_buf = PathBuf::from(&ac_path);

    if !ac_path.is_empty() && !ac_download_url.is_empty() {
        if let Some(parent) = ac_buf.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("create AC dir: {}", e))?;
        }

        let ac_tmp = ac_buf.with_extension("part");
        let url = ac_download_url.clone();
        let tmp = ac_tmp.clone();
        let download_result = tokio::task::spawn_blocking(move || -> Result<(), String> {
            utilities::download_file(&url, &tmp).map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| format!("AC download join: {}", e))?;

        match download_result {
            Ok(_) => {}
            Err(e) => {
                let _ = tokio::fs::remove_file(&ac_tmp).await;
                if !ac_buf.exists() {
                    return Err(format!("Failed to download the anti-cheat: {}", e));
                }
                eprintln!("AC download failed ({e}); reusing existing binary");
            }
        }

        match tokio::fs::rename(&ac_tmp, &ac_buf).await {
            Ok(_) => {}
            Err(e) if ac_buf.exists() => {
                let _ = tokio::fs::remove_file(&ac_tmp).await;
                eprintln!("AC swap failed ({e}); reusing existing binary");
            }
            Err(e) => return Err(format!("Failed to replace the anti-cheat: {}", e)),
        }
    }

    let game_path = PathBuf::from(&file_path);
    let game_dir = game_path
        .parent()
        .and_then(|p| p.parent())
        .ok_or("Failed to get FortniteGame directory")?
        .to_path_buf();

    // Remove old dll
    let game_dll_path = utilities::handle_game_dll_path(&game_dir);
    if game_dll_path.exists() {
        let _gdp = game_dll_path.clone();
        let gd = game_dir.clone();
        tokio::task::spawn_blocking(move || utilities::remove_game_dll_sync(&gd))
            .await
            .map_err(|e| format!("join: {}", e))?
            .map_err(|e| format!("remove dll: {}", e))?;
    }

    // ── Download redirect DLL ──────────────────────────────────────────────
    let dll_name = game_dll_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    if should_skip(&game_dll_path, &redirect_link).await {
        let _ = window.emit(
            "download-progress",
            serde_json::json!({ "type": "main_dll", "file": dll_name, "progress": 100, "stage": "skipped" }),
        );
    } else {
        download_with_progress(&window, &redirect_link, &game_dll_path, "main_dll", &dll_name)
            .await
            .map_err(|e| format!("Failed to download redirect DLL: {}", e))?;
    }

    if !game_dll_path.exists() {
        return Err("Redirect DLL missing after download".into());
    }

    // ── Download & prepare Reset on Release DLL ────────────────────────────
    let reset_dll_path: Option<PathBuf> = if !reset_on_release_dll.trim().is_empty() {
        let clean = reset_on_release_dll.split('?').next().unwrap_or(&reset_on_release_dll);
        let raw_fname = clean.rsplit('/').next().filter(|n| !n.is_empty()).unwrap_or("reset_on_release.dll");
        // Decode %20 and other percent-encoded characters in the filename
        let fname_decoded = raw_fname.replace("%20", " ").replace("%2B", "+").replace("%2b", "+");
        let dest = game_dir.join("Win64").join(&fname_decoded);

        if should_skip(&dest, &reset_on_release_dll).await {
            let _ = window.emit(
                "download-progress",
                serde_json::json!({ "type": "dll", "file": fname_decoded, "progress": 100, "stage": "skipped" }),
            );
        } else {
            download_with_progress(&window, &reset_on_release_dll, &dest, "dll", &fname_decoded)
                .await
                .map_err(|e| format!("Failed to download Reset on Release DLL: {}", e))?;
        }

        if dest.exists() { Some(dest) } else { None }
    } else {
        None
    };

    // ── Download & prepare Edit on Release DLL ─────────────────────────────
    let edit_dll_path: Option<PathBuf> = if !edit_on_release_dll.trim().is_empty() {
        let clean = edit_on_release_dll.split('?').next().unwrap_or(&edit_on_release_dll);
        let raw_fname = clean.rsplit('/').next().filter(|n| !n.is_empty()).unwrap_or("edit_on_release.dll");
        let fname_decoded = raw_fname.replace("%20", " ").replace("%2B", "+").replace("%2b", "+");
        let dest = game_dir.join("Win64").join(&fname_decoded);

        if should_skip(&dest, &edit_on_release_dll).await {
            let _ = window.emit(
                "download-progress",
                serde_json::json!({ "type": "dll", "file": fname_decoded, "progress": 100, "stage": "skipped" }),
            );
        } else {
            download_with_progress(&window, &edit_on_release_dll, &dest, "dll", &fname_decoded)
                .await
                .map_err(|e| format!("Failed to download Edit on Release DLL: {}", e))?;
        }

        if dest.exists() { Some(dest) } else { None }
    } else {
        None
    };

    // ── Paks directory ─────────────────────────────────────────────────────
    let paks_dir = game_path
        .parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .ok_or("Invalid game root")?
        .join("Content")
        .join("Paks");

    tokio::fs::create_dir_all(&paks_dir)
        .await
        .map_err(|e| format!("create paks dir: {}", e))?;

    // ── Whitelist validation ───────────────────────────────────────────────
    if !pak_files_whitelist.is_empty() {
        let mut bad: Vec<String> = Vec::new();

        let mut rd = tokio::fs::read_dir(&paks_dir)
            .await
            .map_err(|e| format!("read paks dir: {}", e))?;

        while let Some(entry) = rd.next_entry().await.map_err(|e| e.to_string())? {
            let path = entry.path();
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if ext != "pak" && ext != "sig" { continue; }
            let fname = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

            match pak_files_whitelist.iter().find(|i| i.name == fname) {
                Some(info) => {
                    let sz = tokio::fs::metadata(&path).await.map(|m| m.len()).unwrap_or(0);
                    if sz != info.size {
                        bad.push(format!("{} (expected {} B, got {} B)", fname, info.size, sz));
                    }
                }
                None => {
                    match tokio::fs::remove_file(&path).await {
                        Ok(_) => { let _ = window.emit("verify-build", serde_json::json!({ "file": fname, "status": "deleted" })); }
                        Err(e) => { let _ = window.emit("verify-build", serde_json::json!({ "file": fname, "status": "failed", "error": e.to_string() })); }
                    }
                }
            }
        }

        if !bad.is_empty() {
            let _ = window.emit("build-validation-error", serde_json::json!({ "message": "Build may be corrupted", "errors": bad }));
            let _ = window.emit("download-error", serde_json::json!({ "reason": "validation_failed" }));
            return Err(format!("Validation failed:\n{}", bad.join("\n")));
        }
    }

    // ── Download custom PAKs ───────────────────────────────────────────────
    if use_custom_paks && !custom_paks_links.is_empty() {
        for (idx, link) in custom_paks_links.iter().enumerate() {
            let link = link.trim();
            if link.is_empty() { continue; }
            let clean = link.split('?').next().unwrap_or(link);
            let fname = match clean.rsplit('/').next() {
                Some(n) if !n.is_empty() => n.to_string(),
                _ => format!("CustomPak_{}.pak", idx),
            };
            let dest = paks_dir.join(&fname);
            if should_skip(&dest, link).await {
                let _ = window.emit("download-progress", serde_json::json!({ "type": "pak", "file": fname, "progress": 100, "stage": "skipped" }));
            } else {
                download_with_progress(&window, link, &dest, "pak", &fname)
                    .await
                    .map_err(|e| format!("Failed to download pak '{}': {}", fname, e))?;
            }
        }
    }

    // ── Emit download-complete ─────────────────────────────────────────────
    let _ = window.emit("download-complete", serde_json::json!({}));

    // ── Build launch args ──────────────────────────────────────────────────
    let mut args: Vec<String> = vec![
        "-epicapp=Fortnite", "-epicenv=Prod", "-epiclocale=en-us", "-epicportal",
        "-nobe", "-fromfl=eac", "-nocodeguards", "-nouac",
        "-fltoken=3db3ba5dcbd2e16703f3978d",
        "-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYmU5ZGE1YzJmYmVhNDQwN2IyZjQwZWJhYWQ4NTlhZDQiLCJnZW5lcmF0ZWQiOjE2Mzg3MTcyNzgsImNhbGRlcmFHdWlkIjoiMzgxMGI4NjMtMmE2NS00NDU3LTliNTgtNGRhYjNiNDgyYTg2IiwiYWNQcm92aWRlciI6IkVhc3lBbnRpQ2hlYXQiLCJub3RlcyI6IiIsImZhbGxiYWNrIjpmYWxzZX0.VAWQB67RTxhiWOxx7DBjnzDnXyyEnX7OljJm-j2d88G_WgwQ9wrE6lwMEHZHjBd1ISJdUO1UVUqkfLdU5nofBQs",
        "-skippatchcheck", "-AUTH_TYPE=epic", "-useallavailablecores", "-steamimportavailable",
    ].into_iter().map(String::from).collect();

    args.insert(args.len() - 3, format!("-AUTH_LOGIN={}", auth_login));
    args.insert(args.len() - 3, format!("-AUTH_PASSWORD={}", auth_password));

    if !backend.trim().is_empty() {
        args.push(format!("-backend={}", backend));
    }

    if performance_mode {
        args.push("-FeatureLevelES31".to_string());
    }

    let win64 = game_dir.join("Win64");
    let fn_shipping  = win64.join("FortniteClient-Win64-Shipping.exe");
    let fn_launcher  = win64.join("FortniteLauncher.exe");
    let eac          = win64.join("FortniteClient-Win64-Shipping_BE.exe");
    let _game_dir2   = game_dir.clone();

    // Collect DLL work so we can move it into spawn_blocking
    let dll_work: Vec<(String, PathBuf)> = if inject_extra_dlls {
        let all_links: Vec<String> = extra_dll_links
            .iter()
            .chain(extra_dll_options.iter().flat_map(|m| m.values()))
            .cloned()
            .collect();

        // Download DLLs asynchronously first
        let mut pairs: Vec<(String, PathBuf)> = Vec::new();
        for (idx, link) in all_links.iter().enumerate() {
            let link = link.trim();
            if link.is_empty() { continue; }
            let clean = link.split('?').next().unwrap_or(link);
            let fname = match clean.rsplit('/').next() {
                Some(n) if !n.is_empty() => n.replace('%', "_"),
                _ => format!("ExtraDll_{}.dll", idx),
            };
            let dest = win64.join(&fname);
            if should_skip(&dest, link).await {
                let _ = window.emit("download-progress", serde_json::json!({ "type": "dll", "file": fname, "progress": 100, "stage": "skipped" }));
            } else {
                download_with_progress(&window, link, &dest, "dll", &fname)
                    .await
                    .map_err(|e| format!("DLL download '{}': {}", fname, e))?;
            }
            pairs.push((link.to_string(), dest));
        }
        pairs
    } else {
        Vec::new()
    };

    // ── Launch + inject in a blocking thread (WinAPI is not Send) ─────────
    let args_clone = args.clone();
    let ac_path_clone = ac_path.trim().to_string();

    let result = tokio::task::spawn_blocking(move || -> Result<bool, String> {
        use winapi::um::{handleapi::CloseHandle, winbase::CREATE_SUSPENDED, winuser::SW_SHOW};

        let combined_str = args_clone.join(" ");
        let exe_str = fn_shipping.to_str().ok_or("Invalid exe path")?;

        let pid: u32 = if !ac_path_clone.is_empty() && Path::new(&ac_path_clone).exists() {
            // ── Anti-cheat mode ───────────────────────────────────────────
            // The AC launches the game suspended, adopts it as a child
            // process, randomizes the image name, then resumes it. It reports
            // the game PID through the result file so we can keep injecting.
            let result_file = std::env::temp_dir().join("catac_result.txt");
            let state_file = std::env::temp_dir().join("catac_state.txt");

            let _ = std::fs::remove_file(&result_file);
            let _ = std::fs::remove_file(&state_file);

            let ac_args: Vec<String> = vec![
                "--game".into(),
                exe_str.to_string(),
                "--args".into(),
                combined_str,
                "--obfuscate".into(),
                "1".into(),
                "--result".into(),
                result_file.to_string_lossy().to_string(),
                "--state".into(),
                state_file.to_string_lossy().to_string(),
            ];

            spawn_ac_and_get_pid(&ac_path_clone, &ac_args, &result_file)?
        } else {
            // ── Legacy mode (no anti-cheat) ───────────────────────────────
            use winapi::shared::windef::HWND;
            use winapi::um::processthreadsapi::GetProcessId;
            use winapi::um::shellapi::{SEE_MASK_NOCLOSEPROCESS, SHELLEXECUTEINFOA, ShellExecuteExA};

            let exe_c = CString::new(exe_str).map_err(|e| e.to_string())?;
            let args_c = CString::new(combined_str).map_err(|e| e.to_string())?;

            // Try to launch with an optional verb ("runas" or open). Returns
            // the process handle on success, or None.
            let try_launch = |verb: &str| -> Option<winapi::um::winnt::HANDLE> {
                let verb_c = CString::new(verb).unwrap();
                let mut sei: SHELLEXECUTEINFOA = unsafe { zeroed() };
                sei.cbSize = std::mem::size_of::<SHELLEXECUTEINFOA>() as u32;
                sei.fMask = SEE_MASK_NOCLOSEPROCESS;
                sei.hwnd = std::ptr::null_mut() as HWND;
                sei.lpVerb = verb_c.as_ptr();
                sei.lpFile = exe_c.as_ptr();
                sei.lpParameters = args_c.as_ptr();
                sei.nShow = SW_SHOW;

                if unsafe { ShellExecuteExA(&mut sei) } != 0 && !sei.hProcess.is_null() {
                    Some(sei.hProcess)
                } else {
                    None
                }
            };

            let h_process = try_launch("runas")
                .or_else(|| try_launch("open"))
                .ok_or_else(|| {
                    let code = unsafe { winapi::um::errhandlingapi::GetLastError() };
                    format!(
                        "Failed to launch the game (ShellExecuteExA error {}). \
                         Make sure you approved the UAC prompt.",
                        code
                    )
                })?;

            let pid = unsafe { GetProcessId(h_process) };
            unsafe { CloseHandle(h_process) };

            if pid == 0 {
                return Err("Failed to get game process ID — the game may not have started.".into());
            }
            pid
        };

        std::thread::sleep(std::time::Duration::from_secs(5));

        let args_os: Vec<OsString> = args_clone.iter().map(OsString::from).collect();

        let _ = Command::new(&eac)
            .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
            .args(args_os.iter().map(|a| a as &OsStr))
            .stdout(Stdio::piped())
            .spawn();

        let _ = Command::new(&fn_launcher)
            .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
            .args(args_os.iter().map(|a| a as &OsStr))
            .stdout(Stdio::piped())
            .spawn();

        std::thread::sleep(std::time::Duration::from_secs(15));

        // Inject DLLs
        for (_link, dest) in &dll_work {
            utilities::inject_dll(pid, dest.to_str().ok_or("Bad DLL path")?)
                .map_err(|e| format!("inject '{}': {}", dest.display(), e))?;
            std::thread::sleep(std::time::Duration::from_millis(500));
        }

        if let Some(ref rr_path) = reset_dll_path {
            let rr_str = rr_path.to_str().ok_or("Bad Reset on Release DLL path")?;
            let mut last_err = String::new();
            let mut injected = false;
            for attempt in 0..5u32 {
                match utilities::inject_dll(pid, rr_str) {
                    Ok(_) => { injected = true; break; }
                    Err(e) => {
                        last_err = e;
                        std::thread::sleep(std::time::Duration::from_millis(500 * (attempt + 1) as u64));
                    }
                }
            }
            if !injected {
                return Err(format!("inject reset_on_release after 5 attempts: {}", last_err));
            }
            std::thread::sleep(std::time::Duration::from_millis(300));
        }

        if let Some(ref er_path) = edit_dll_path {
            let er_str = er_path.to_str().ok_or("Bad Edit on Release DLL path")?;
            let mut last_err = String::new();
            let mut injected = false;
            for attempt in 0..5u32 {
                match utilities::inject_dll(pid, er_str) {
                    Ok(_) => { injected = true; break; }
                    Err(e) => {
                        last_err = e;
                        std::thread::sleep(std::time::Duration::from_millis(500 * (attempt + 1) as u64));
                    }
                }
            }
            if !injected {
                return Err(format!("inject edit_on_release after 5 attempts: {}", last_err));
            }
        }

        Ok(true)
    })
    .await
    .map_err(|e| format!("spawn_blocking join: {}", e))??;

    Ok(result)
}

// ─── close_game ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn close_game() -> Result<(), String> {
    let _ = utilities::kill_all_procs();
    Ok(())
}
