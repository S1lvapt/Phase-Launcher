use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use futures_util::StreamExt;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use tauri::{Emitter, Window};
use tokio::io::{AsyncSeekExt, AsyncWriteExt};

/// Global cancel flag for the currently running build download. Simple
/// on purpose: this launcher only ever runs one build download at a time,
/// so a single shared flag (reset at the start of each download_build
/// call) is enough — no need to plumb a per-download id through the
/// frontend.
static CANCEL_FLAG: Lazy<Mutex<Option<Arc<AtomicBool>>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug)]
struct CancelledError;

impl std::fmt::Display for CancelledError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Download cancelled by user")
    }
}

/// Signals the in-progress build download to stop as soon as possible.
/// The partially-downloaded `.part` file is left on disk so a future
/// download_build call can resume from where this one was cancelled.
#[tauri::command]
pub fn cancel_build_download() {
    if let Some(flag) = CANCEL_FLAG.lock().unwrap().as_ref() {
        flag.store(true, Ordering::SeqCst);
    }
}

/// Minimum size (bytes) a `.part` file must already have before we bother
/// trying to resume it. Protects against resuming into a corrupted /
/// truncated-in-the-middle file from a previous crash.
const MIN_RESUMABLE_BYTES: u64 = 1024;

/// How many times to automatically retry a dropped connection before
/// giving up and surfacing an error to the frontend. Big files over flaky
/// connections routinely hit "end of file before message length reached"
/// mid-stream — that's a transient network hiccup, not a real failure, so
/// we just resume from wherever the .part file left off.
const MAX_RETRIES: u32 = 8;

async fn get_remote_file_size(url: &str) -> Result<u64, String> {
    let client = reqwest::Client::new();
    let resp = client
        .head(url)
        .send()
        .await
        .map_err(|e| format!("HEAD {}: {}", url, e))?;

    resp.headers()
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| "Server did not report Content-Length".to_string())
}

/// Downloads `url` into `dest_path`, resuming from a `.part` file left
/// behind by a previous attempt if possible. Emits `download-progress`
/// events with `type: "build"` so the frontend can drive a single
/// progress bar for the whole thing.
///
/// Transparently retries (resuming via Range requests) on dropped
/// connections up to MAX_RETRIES times before giving up.
#[tauri::command]
pub async fn download_build(
    window: Window,
    url: String,
    dest_path: String,
) -> Result<bool, String> {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    *CANCEL_FLAG.lock().unwrap() = Some(cancel_flag.clone());

    let mut attempt: u32 = 0;
    let result = loop {
        match download_build_attempt(&window, &url, &dest_path, &cancel_flag).await {
            Ok(done) => break Ok(done),
            Err(err) => {
                if cancel_flag.load(Ordering::SeqCst) {
                    let _ = window.emit(
                        "download-progress",
                        serde_json::json!({ "type": "build", "stage": "cancelled" }),
                    );
                    break Err(CancelledError.to_string());
                }

                attempt += 1;
                if attempt > MAX_RETRIES {
                    break Err(format!("{} (after {} retries)", err, MAX_RETRIES));
                }

                let backoff_secs = (attempt as u64).min(5);
                let _ = window.emit(
                    "download-progress",
                    serde_json::json!({
                        "type": "build",
                        "stage": "retrying",
                        "attempt": attempt,
                        "max_attempts": MAX_RETRIES,
                        "error": err,
                    }),
                );
                tokio::time::sleep(std::time::Duration::from_secs(backoff_secs)).await;
            }
        }
    };

    *CANCEL_FLAG.lock().unwrap() = None;
    result
}

async fn download_build_attempt(
    window: &Window,
    url: &str,
    dest_path: &str,
    cancel_flag: &Arc<AtomicBool>,
) -> Result<bool, String> {
    let dest = PathBuf::from(dest_path);
    let part_path = {
        let mut p = dest.clone();
        let mut file_name = p.file_name().unwrap_or_default().to_os_string();
        file_name.push(".part");
        p.set_file_name(file_name);
        p
    };

    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("mkdir: {}", e))?;
    }

    let remote_size = get_remote_file_size(url).await?;

    // Already fully downloaded (e.g. app restarted after finishing)?
    if dest.exists() {
        let local_size = tokio::fs::metadata(&dest).await.map(|m| m.len()).unwrap_or(0);
        if local_size == remote_size {
            let _ = window.emit(
                "download-progress",
                serde_json::json!({ "type": "build", "progress": 100, "stage": "skipped" }),
            );
            return Ok(true);
        }
    }

    let mut resume_from: u64 = 0;
    if part_path.exists() {
        let existing = tokio::fs::metadata(&part_path).await.map(|m| m.len()).unwrap_or(0);
        if existing >= MIN_RESUMABLE_BYTES && existing < remote_size {
            resume_from = existing;
        } else if existing >= remote_size {
            let _ = tokio::fs::remove_file(&part_path).await;
        }
    }

    let client = reqwest::Client::new();
    let mut request = client.get(url);
    if resume_from > 0 {
        request = request.header(reqwest::header::RANGE, format!("bytes={}-", resume_from));
    }

    let resp = request
        .send()
        .await
        .map_err(|e| format!("GET {}: {}", url, e))?;

    let status = resp.status();
    let server_supports_resume = status == reqwest::StatusCode::PARTIAL_CONTENT;

    if !status.is_success() {
        return Err(format!("HTTP {} for {}", status, url));
    }

    // If we asked for a range but the server ignored it (sent 200 + full
    // body instead of 206), we must restart the file from scratch.
    let mut file = if resume_from > 0 && server_supports_resume {
        let mut f = tokio::fs::OpenOptions::new()
            .append(true)
            .open(&part_path)
            .await
            .map_err(|e| format!("reopen part file: {}", e))?;
        f.seek(std::io::SeekFrom::End(0)).await.ok();
        f
    } else {
        resume_from = 0;
        tokio::fs::File::create(&part_path)
            .await
            .map_err(|e| format!("create {}: {}", part_path.display(), e))?
    };

    let mut downloaded: u64 = resume_from;
    let mut last_pct: f64 = -1.0;
    let mut stream = resp.bytes_stream();

    let _ = window.emit(
        "download-progress",
        serde_json::json!({
            "type": "build",
            "progress": (downloaded as f64 / remote_size as f64 * 100.0).min(100.0),
            "stage": "downloading",
            "downloaded": downloaded,
            "total": remote_size,
        }),
    );

    while let Some(chunk) = stream.next().await {
        if cancel_flag.load(Ordering::SeqCst) {
            file.flush().await.ok();
            return Err(CancelledError.to_string());
        }

        let chunk = chunk.map_err(|e| format!("stream: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("write: {}", e))?;
        downloaded += chunk.len() as u64;

        let pct = (downloaded as f64 / remote_size as f64 * 100.0).min(100.0);
        if pct - last_pct >= 0.1 {
            last_pct = pct;
            let _ = window.emit(
                "download-progress",
                serde_json::json!({
                    "type": "build",
                    "progress": pct,
                    "stage": "downloading",
                    "downloaded": downloaded,
                    "total": remote_size,
                }),
            );
        }
    }

    file.flush().await.map_err(|e| format!("flush: {}", e))?;
    drop(file);

    tokio::fs::rename(&part_path, &dest)
        .await
        .map_err(|e| format!("finalize rename: {}", e))?;

    let _ = window.emit(
        "download-progress",
        serde_json::json!({ "type": "build", "progress": 100, "stage": "downloaded" }),
    );

    Ok(true)
}

/// Searches `search_dir` recursively (bounded depth, since RAR archives
/// commonly wrap their contents in one or more nested top-level folders
/// e.g. `27.11/27.11/FortniteGame/...`) for a `FortniteGame` directory,
/// and returns wherever it was found — i.e. the actual build root to
/// hand off to the importer.
#[tauri::command]
pub async fn find_fortnite_game_root(search_dir: String) -> Result<Option<String>, String> {
    const MAX_DEPTH: u32 = 6;

    fn search_blocking(dir: &Path, depth: u32) -> Option<PathBuf> {
        if dir.join("FortniteGame").is_dir() {
            return Some(dir.to_path_buf());
        }
        if depth >= MAX_DEPTH {
            return None;
        }

        let entries = match std::fs::read_dir(dir) {
            Ok(e) => e,
            Err(_) => return None,
        };

        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                if let Some(found) = search_blocking(&path, depth + 1) {
                    return Some(found);
                }
            }
        }

        None
    }

    let base = PathBuf::from(search_dir);
    let result = tokio::task::spawn_blocking(move || search_blocking(&base, 0))
        .await
        .map_err(|e| format!("join: {}", e))?;

    Ok(result.map(|p| p.to_string_lossy().to_string()))
}

/// Extracts a .rar archive at `archive_path` into `dest_dir`, emitting
/// `extract-progress` events (`type: "build"`) as each entry is unpacked.
#[tauri::command]
pub async fn extract_build(
    window: Window,
    archive_path: String,
    dest_dir: String,
) -> Result<bool, String> {
    let archive_path = PathBuf::from(archive_path);
    let dest_dir = PathBuf::from(dest_dir);

    tokio::fs::create_dir_all(&dest_dir)
        .await
        .map_err(|e| format!("mkdir dest: {}", e))?;

    let window_clone = window.clone();
    let archive_ext = archive_path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase());

    tokio::task::spawn_blocking(move || -> Result<(), String> {
        match archive_ext.as_deref() {
            Some("rar") => extract_rar_blocking(&archive_path, &dest_dir, &window_clone),
            Some("zip") => extract_zip_blocking(&archive_path, &dest_dir, &window_clone),
            Some(ext) => Err(format!("Unsupported archive format: {}", ext)),
            None => Err("Archive file has no extension".to_string()),
        }
    })
    .await
    .map_err(|e| format!("join: {}", e))??;

    let _ = window.emit(
        "extract-progress",
        serde_json::json!({ "type": "build", "progress": 100, "stage": "done" }),
    );

    Ok(true)
}

fn extract_zip_blocking(archive_path: &Path, dest_dir: &Path, window: &Window) -> Result<(), String> {
    use std::fs::File;
    use std::io::{copy, Read};
    use zip::ZipArchive;

    let file = File::open(archive_path)
        .map_err(|e| format!("open zip file: {}", e))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("open zip archive: {}", e))?;
    let total_entries = archive.len().max(1);
    let mut done: usize = 0;

    for i in 0..archive.len() {
        let mut zip_file = archive
            .by_index(i)
            .map_err(|e| format!("read zip entry {}: {}", i, e))?;
        let entry_name = zip_file
            .sanitized_name()
            .to_string_lossy()
            .to_string();
        let out_path = dest_dir.join(entry_name);

        if zip_file.is_dir() {
            std::fs::create_dir_all(&out_path)
                .map_err(|e| format!("create dir {}: {}", out_path.display(), e))?;
        } else {
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("create dir {}: {}", parent.display(), e))?;
            }
            let mut outfile = File::create(&out_path)
                .map_err(|e| format!("create file {}: {}", out_path.display(), e))?;
            copy(&mut zip_file, &mut outfile)
                .map_err(|e| format!("write file {}: {}", out_path.display(), e))?;
        }

        done += 1;
        let pct = (done as f64 / total_entries as f64 * 100.0).min(100.0);
        let _ = window.emit(
            "extract-progress",
            serde_json::json!({
                "type": "build",
                "progress": pct,
                "stage": "extracting",
                "file": zip_file.name().to_string(),
                "done": done,
                "total": total_entries,
            }),
        );
    }

    Ok(())
}

fn extract_rar_blocking(archive_path: &Path, dest_dir: &Path, window: &Window) -> Result<(), String> {
    use unrar::Archive;

    // First pass: count entries so we can report percentage progress.
    let listing = Archive::new(archive_path)
        .open_for_listing()
        .map_err(|e| format!("open for listing: {}", e))?;
    let total_entries = listing.filter_map(|e| e.ok()).count().max(1);

    // Second pass: actually extract.
    let mut archive = Archive::new(archive_path)
        .open_for_processing()
        .map_err(|e| format!("open for processing: {}", e))?;

    let mut done: usize = 0;

    while let Some(header) = archive
        .read_header()
        .map_err(|e| format!("read header: {}", e))?
    {
        let entry_name = header.entry().filename.to_string_lossy().to_string();
        let is_dir = header.entry().is_directory();

        archive = if is_dir {
            header.skip().map_err(|e| format!("skip '{}': {}", entry_name, e))?
        } else {
            header
                .extract_with_base(dest_dir)
                .map_err(|e| format!("extract '{}': {}", entry_name, e))?
        };

        done += 1;
        let pct = (done as f64 / total_entries as f64 * 100.0).min(100.0);
        let _ = window.emit(
            "extract-progress",
            serde_json::json!({
                "type": "build",
                "progress": pct,
                "stage": "extracting",
                "file": entry_name,
                "done": done,
                "total": total_entries,
            }),
        );
    }

    Ok(())
}
