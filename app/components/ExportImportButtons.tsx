"use client";

import { useRef } from "react";
import { STORAGE_KEYS } from "../hooks/useTableState";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

export function ExportImportButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveData = () => {
    const exportData: Record<string, string | null> = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      exportData[key] = localStorage.getItem(key);
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rds4plus_data_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        Object.entries(importData).forEach(([key, value]) => {
          if (value !== null && Object.values(STORAGE_KEYS).includes(key)) {
            localStorage.setItem(key, value as string);
          }
        });
        window.location.reload();
      } catch {
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
      <div className="flex items-center h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 overflow-hidden shrink-0">
        <button
          onClick={handleSaveData}
          className="flex items-center h-full gap-1.5 px-2.5 sm:px-3 text-xs font-medium hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white transition-all cursor-pointer"
          title="Export your stars, priorities, and view settings"
        >
          <DownloadIcon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
          <span>Export</span>
        </button>
        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700/80 shrink-0" />
        <button
          onClick={handleImportData}
          className="flex items-center h-full gap-1.5 px-2.5 sm:px-3 text-xs font-medium hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white transition-all cursor-pointer"
          title="Import stars, priorities, and view settings from a file"
        >
          <UploadIcon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
          <span>Import</span>
        </button>
      </div>
    </>
  );
}
