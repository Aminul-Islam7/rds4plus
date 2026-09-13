@echo off
setlocal

echo ========================================================
echo   RDS4+ Local Sync Daemon - Windows Startup Installer
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "VBS_SOURCE=%SCRIPT_DIR%rds4-daemon.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%STARTUP_DIR%\RDS4-Sync-Daemon.vbs"

echo [1/3] Copying launcher to Windows Startup folder...
copy /Y "%VBS_SOURCE%" "%TARGET_VBS%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy to Startup folder: %STARTUP_DIR%
    pause
    exit /b 1
)

echo [2/3] Checking if daemon is already running...
taskkill /F /FI "WINDOWTITLE eq *local_sync_daemon*" >nul 2>&1

echo [3/3] Starting RDS4 Sync Daemon in background...
start "" wscript.exe "%TARGET_VBS%"

echo.
echo ========================================================
echo   SUCCESS! Daemon is installed and running in background.
echo   - Runs every 5 minutes automatically.
echo   - Starts automatically when Windows boots.
echo   - Logs saved to: logs\sync_daemon.log
echo ========================================================
echo.
pause
