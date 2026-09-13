@echo off
echo Stopping RDS4 Sync Daemon...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*local_sync_daemon.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Killed PID: ' + $_.ProcessId) }"
echo Done.
