use std::{
    ffi::CString,
    fs,
    io::Write,
    path::{Path, PathBuf},
};
use sysinfo::{ProcessExt, System, SystemExt};
use winapi::um::tlhelp32::{
    CreateToolhelp32Snapshot, Thread32First, Thread32Next, TH32CS_SNAPTHREAD, THREADENTRY32,
};
use winapi::um::winnt::HANDLE;
use winapi::um::winnt::THREAD_SUSPEND_RESUME;
use winapi::um::{handleapi::CloseHandle, memoryapi::VirtualFreeEx};
use winapi::um::{
    processthreadsapi::{OpenThread, SuspendThread},
    winnt::{
        PROCESS_CREATE_THREAD, PROCESS_QUERY_INFORMATION, PROCESS_VM_OPERATION, PROCESS_VM_READ,
        PROCESS_VM_WRITE,
    },
};
use winapi::{
    shared::minwindef::{DWORD, FALSE, LPVOID},
    um::{
        libloaderapi::{GetModuleHandleA, GetProcAddress},
        memoryapi::VirtualAllocEx,
        processthreadsapi::{CreateRemoteThread, OpenProcess},
        synchapi::WaitForSingleObject,
        winbase::INFINITE,
        winnt::{MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_EXECUTE_READWRITE},
    },
};
use windows::core::PCSTR;
use windows::Win32::{
    Foundation::{CloseHandle as Win32CloseHandle, HWND},
    System::Threading::WaitForSingleObject as Win32WaitForSingleObject,
    UI::{Shell::ShellExecuteExA, Shell::SEE_MASK_NOCLOSEPROCESS, Shell::SHELLEXECUTEINFOA, WindowsAndMessaging::SW_HIDE},
};

const FORTNITE_PROCS: [&str; 7] = [
    "EpicgamesLauncher.exe",
    "FortniteLauncher.exe",
    "FortniteClient-Win64-Shipping.exe",
    "EasyAntiCheat_EOS.exe",
    "EpicWebHelper.exe",
    "FortniteClient-Win64-Shipping_BE.exe",
    "FortniteClient-Win64-Shipping_EAC.exe",
];

/// The obfuscated exe name the anti-cheat gave the running game (empty when
/// the AC is not in use). The AC writes it to the temp dir so the launcher
/// can still detect / kill the game by its randomized name.
pub fn obfuscated_proc_name() -> Option<String> {
    let path = std::env::temp_dir().join("catac_state.txt");
    let content = std::fs::read_to_string(path).ok()?;
    let name = content.trim();
    if name.is_empty() {
        None
    } else {
        Some(name.to_string())
    }
}

fn target_names() -> Vec<String> {
    let mut names: Vec<String> = FORTNITE_PROCS.iter().map(|s| s.to_string()).collect();
    if let Some(obf) = obfuscated_proc_name() {
        names.push(obf);
    }
    names
}

pub fn any_fortnite_proc_running() -> bool {
    let names = target_names();
    let mut system = System::new_all();
    system.refresh_processes();

    system.processes().values().any(|process| {
        names
            .iter()
            .any(|target| process.name().eq_ignore_ascii_case(target))
    })
}

/// Kills all known Fortnite-related processes via an elevated (UAC) batch
/// file running `taskkill`, then waits for the batch to finish and verifies
/// the processes are actually gone before returning success. This mirrors
/// how the game is launched (also elevated), since the game process itself
/// needs admin rights to be terminated.
pub fn kill_all_procs() -> Result<(), String> {
    // Nothing to do if nothing is running.
    if !any_fortnite_proc_running() {
        return Ok(());
    }

    let batch_path = std::env::temp_dir().join("close.bat");

    {
        let mut file = std::fs::File::create(&batch_path)
            .map_err(|e| format!("Failed to create batch file: {}", e))?;

        let mut write_line =
            |line: &str| writeln!(file, "{}", line).map_err(|e| format!("Write error: {}", e));

        write_line("@echo off")?;
        let mut names = target_names();
        names.push("CatAC.exe".to_string());
        for name in names {
            write_line(&format!("taskkill /F /IM \"{}\" >nul 2>&1", name))?;
        }
        write_line("del \"%~f0\"")?;
    }

    let path_str = batch_path
        .to_str()
        .ok_or("Failed to convert batch path to string")?;
    let path_cstr = CString::new(path_str).map_err(|e| format!("CString error: {}", e))?;
    let verb_cstr = CString::new("runas").unwrap();

    let mut sei: SHELLEXECUTEINFOA = unsafe { std::mem::zeroed() };
    sei.cbSize = std::mem::size_of::<SHELLEXECUTEINFOA>() as u32;
    sei.fMask = SEE_MASK_NOCLOSEPROCESS;
    sei.hwnd = HWND(std::ptr::null_mut());
    sei.lpVerb = PCSTR(verb_cstr.as_ptr() as *const u8);
    sei.lpFile = PCSTR(path_cstr.as_ptr() as *const u8);
    sei.nShow = SW_HIDE.0;

    let launched = unsafe { ShellExecuteExA(&mut sei) };

    if launched.is_err() {
        return Err(
            "Failed to launch elevated close request. The UAC prompt may have been cancelled."
                .into(),
        );
    }

    if sei.hProcess.is_invalid() {
        return Err(
            "The UAC prompt was cancelled or elevation was denied, so the game could not be closed."
                .into(),
        );
    }

    // Wait for the batch file (and its taskkill calls) to actually finish,
    // instead of assuming success the moment it launches.
    unsafe {
        Win32WaitForSingleObject(sei.hProcess, 10_000);
        let _ = Win32CloseHandle(sei.hProcess);
    }

    // Give Windows a brief moment to fully tear down the processes after
    // taskkill reports success, then verify they are actually gone.
    for _ in 0..10 {
        if !any_fortnite_proc_running() {
            return Ok(());
        }
        std::thread::sleep(std::time::Duration::from_millis(300));
    }

    Err("Timed out waiting for the game to close. It may still be running.".into())
}

pub fn handle_game_dll_path(game_path: &Path) -> PathBuf {
    game_path.parent().unwrap().parent().unwrap().join(
        "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll",
    )
}

pub fn remove_game_dll_sync(game_path: &Path) -> Result<(), String> {
    let game_dll_path = handle_game_dll_path(game_path);

    loop {
        match std::fs::remove_file(&game_dll_path) {
            Ok(_) => break,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => break,
            Err(_) => std::thread::sleep(std::time::Duration::from_millis(100)),
        }
    }
    Ok(())
}

#[tauri::command]
pub fn remove_client_dll_sync(client_dll_path: &Path) -> Result<(), String> {
    loop {
        match std::fs::remove_file(&client_dll_path) {
            Ok(_) => break,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => break,
            Err(_) => std::thread::sleep(std::time::Duration::from_millis(100)),
        }
    }
    Ok(())
}

#[tauri::command]
pub fn download_file(url: &str, dest: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;
    let response = client.get(url).send()?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()).into());
    }
    let mut file = fs::File::create(dest)?;
    let content = response.bytes()?;
    file.write_all(&content)?;
    Ok(())
}

// https://www.reddit.com/r/rust/comments/xu2hiw/comment/iqtrpb5
#[tauri::command]
pub fn suspend_process(pid: u32) -> (u32, bool) {
    unsafe {
        let mut has_err = false;
        let mut count: u32 = 0;

        let te: &mut THREADENTRY32 = &mut std::mem::zeroed();
        (*te).dwSize = std::mem::size_of::<THREADENTRY32>() as u32;

        let snapshot: HANDLE = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);

        if Thread32First(snapshot, te) == 1 {
            loop {
                if pid == (*te).th32OwnerProcessID {
                    let tid = (*te).th32ThreadID;

                    let thread: HANDLE = OpenThread(THREAD_SUSPEND_RESUME, FALSE, tid);
                    has_err |= SuspendThread(thread) as i32 == -1i32;

                    CloseHandle(thread);
                    count += 1;
                }

                if Thread32Next(snapshot, te) == 0 {
                    break;
                }
            }
        }

        CloseHandle(snapshot);

        (count, has_err)
    }
}

#[tauri::command]
pub fn inject_dll(pid: u32, dll_path: &str) -> Result<(), String> {
    unsafe {
        let h_process = OpenProcess(
            PROCESS_CREATE_THREAD
                | PROCESS_QUERY_INFORMATION
                | PROCESS_VM_OPERATION
                | PROCESS_VM_WRITE
                | PROCESS_VM_READ,
            0,
            pid,
        );
        if h_process.is_null() {
            return Err(format!(
                "Failed to open process. WinError: {}",
                std::io::Error::last_os_error()
            ));
        }

        let dll_path_c = CString::new(dll_path).map_err(|_| "Failed to create CString")?;

        let dll_path_ptr = VirtualAllocEx(
            h_process,
            std::ptr::null_mut(),
            dll_path_c.as_bytes_with_nul().len(),
            MEM_COMMIT | MEM_RESERVE,
            PAGE_EXECUTE_READWRITE,
        );
        if dll_path_ptr.is_null() {
            return Err("Failed to allocate memory".to_string());
        }

        if winapi::um::memoryapi::WriteProcessMemory(
            h_process,
            dll_path_ptr,
            dll_path_c.as_ptr() as LPVOID,
            dll_path_c.as_bytes_with_nul().len(),
            std::ptr::null_mut(),
        ) == 0
        {
            return Err("Failed to write to process memory".to_string());
        }

        let kernel32_c = CString::new("kernel32.dll").unwrap();
        let h_kernel32 = GetModuleHandleA(kernel32_c.as_ptr());
        if h_kernel32.is_null() {
            return Err("Failed to get kernel32.dll handle".to_string());
        }

        let load_library_c = CString::new("LoadLibraryA").unwrap();
        let h_load_library = GetProcAddress(h_kernel32, load_library_c.as_ptr());
        if h_load_library.is_null() {
            return Err("Failed to get address of LoadLibraryA".to_string());
        }

        let thread_handle = CreateRemoteThread(
            h_process,
            std::ptr::null_mut(),
            0,
            Some(std::mem::transmute::<
                _,
                unsafe extern "system" fn(LPVOID) -> DWORD,
            >(h_load_library)),
            dll_path_ptr,
            0,
            std::ptr::null_mut(),
        );
        if thread_handle.is_null() {
            return Err("Failed to create remote thread".to_string());
        }

        WaitForSingleObject(thread_handle, INFINITE);
        VirtualFreeEx(h_process, dll_path_ptr, 0, MEM_RELEASE);
        winapi::um::handleapi::CloseHandle(h_process);
    }

    Ok(())
}
