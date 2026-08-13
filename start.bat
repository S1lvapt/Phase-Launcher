@echo off
title Launcher Setup

bun install
cls
echo Running build script. Do not close this window.
bun tauri build
cls

start src-tauri\target\release\bundle\msi
echo Thanks for buying! <3

pause
exit