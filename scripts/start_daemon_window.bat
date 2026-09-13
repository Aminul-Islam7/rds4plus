@echo off
title RDS4+ Sync Daemon (5m interval)
cd /d "%~dp0\.."
echo Starting RDS4 Sync Daemon in visible console...
node scripts/local_sync_daemon.mjs
pause
