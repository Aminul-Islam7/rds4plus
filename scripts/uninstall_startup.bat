@echo off
setlocal

echo ========================================================
echo   RDS4+ Local Sync Daemon - Windows Startup Uninstaller
echo ========================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%STARTUP_DIR%\RDS4-Sync-Daemon.vbs"

if exist "%TARGET_VBS%" (
    del /F /Q "%TARGET_VBS%"
    echo [OK] Removed from Windows Startup folder.
) else (
    echo [INFO] Startup launcher was not found in Startup folder.
)

echo [OK] Stopping any running sync daemon processes...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*local_sync_daemon.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

echo.
echo ========================================================
echo   Daemon uninstalled and stopped.
echo ========================================================
echo.
pause
