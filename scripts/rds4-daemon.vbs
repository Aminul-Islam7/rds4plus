Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Aminul Islam\OneDrive\Projects\rds4plus"
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""D:\Aminul Islam\OneDrive\Projects\rds4plus\scripts\local_sync_daemon.mjs""", 0, False
