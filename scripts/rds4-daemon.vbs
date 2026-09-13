Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Aminul Islam\OneDrive\Projects\rds4plus"
WshShell.Run "node ""D:\Aminul Islam\OneDrive\Projects\rds4plus\scripts\local_sync_daemon.mjs""", 0, False
