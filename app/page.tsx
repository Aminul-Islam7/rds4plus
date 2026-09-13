"use client";

import { CourseTable } from "./components/CourseTable";
import { HelpModal } from "./components/HelpModal";
import { OnlineVisitors } from "./components/OnlineVisitors";
import { ThemeToggle } from "./components/ThemeToggle";
import { UpdateNotification } from "./components/UpdateNotification";
import { useCourses } from "./context/CourseContext";
import { useMemo, useRef, useState, useEffect } from "react";

// Storage keys (must match useTableState.ts)
const STORAGE_KEYS = {
  STARRED_SECTIONS: "rds4plus_starred_sections",
  PRIORITIES: "rds4plus_priorities",
  SAVED_COURSES: "rds4plus_saved_courses",
  SAVED_FACULTIES: "rds4plus_saved_faculties",
  HIDDEN_COLUMNS: "rds4plus_hidden_columns",
  HIDE_HELP: "rds4plus_hide_help",
};

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

function QuestionMarkCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function Home() {
  const { data } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Auto show help modal on first visit
  useEffect(() => {
    const hideHelp = localStorage.getItem(STORAGE_KEYS.HIDE_HELP);
    if (hideHelp !== "true") {
      setShowHelpModal(true);
    }
  }, []);

  const handleDontShowAgain = () => {
    localStorage.setItem(STORAGE_KEYS.HIDE_HELP, "true");
    setShowHelpModal(false);
  };

  // Calculate unique faculty count (case-insensitive)
  const uniqueFacultyCount = useMemo(() => {
    if (!data?.courses) return 0;
    const seen = new Set<string>();
    data.courses.forEach((c) => {
      const normalizedFaculty = c.faculty.toLowerCase().trim();
      if (normalizedFaculty) seen.add(normalizedFaculty);
    });
    return seen.size;
  }, [data?.courses]);

  // Export localStorage data
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

  // Import localStorage data
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

  // Shared button class for header action buttons
  const btnClass =
    "flex items-center justify-center gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shrink-0";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

      {/* Header — single row, never wraps */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/50 shadow-xs dark:shadow-none transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Left: Text logo + Online visitor pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-none">
                RDS4<span className="text-cyan-400">+</span>
              </h1>
              <OnlineVisitors />
            </div>

            {/* Center: Semester badge + stats — hides labels on mobile, shows numbers only */}
            {data ? (
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
                {/* Semester badge — hidden on xs */}
                <div className="hidden sm:inline-flex items-center gap-1.5 h-7 sm:h-8 rounded-lg bg-cyan-500/15 dark:bg-cyan-500/20 px-2.5 shrink-0">
                  <svg className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-cyan-700 dark:text-cyan-300 font-medium text-xs whitespace-nowrap">{data.meta.semester}</span>
                </div>
                {/* Stats pill */}
                <div className="flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 sm:px-2.5 text-[10px] sm:text-xs whitespace-nowrap shrink-0">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{data.meta.uniqueCourses}</span>
                  <span className="text-slate-500 hidden sm:inline">courses</span>
                  <div className="h-2.5 w-px bg-slate-300 dark:bg-slate-700/60" />
                  <span className="font-bold text-violet-600 dark:text-violet-400">{data.meta.totalSections}</span>
                  <span className="text-slate-500 hidden sm:inline">sections</span>
                  <div className="h-2.5 w-px bg-slate-300 dark:bg-slate-700/60" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{uniqueFacultyCount}</span>
                  <span className="text-slate-500 hidden sm:inline">faculties</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden animate-pulse">
                <div className="hidden sm:inline-flex h-7 sm:h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800/80 shrink-0" />
                <div className="h-7 sm:h-8 w-36 sm:w-56 rounded-lg bg-slate-200 dark:bg-slate-800/80 shrink-0" />
              </div>
            )}

            {/* Right: Action buttons — icon-only on mobile, icon+label on sm+ */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Export + Import merged pill */}
              <div className="flex items-center h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 overflow-hidden shrink-0">
                <button
                  onClick={handleSaveData}
                  className="flex items-center h-full gap-1.5 px-2 sm:px-3 text-xs font-medium hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white transition-all cursor-pointer"
                  title="Export your stars, priorities, and view settings"
                >
                  <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <div className="w-px h-3.5 sm:h-4 bg-slate-200 dark:bg-slate-700/80 shrink-0" />
                <button
                  onClick={handleImportData}
                  className="flex items-center h-full gap-1.5 px-2 sm:px-3 text-xs font-medium hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white transition-all cursor-pointer"
                  title="Import stars, priorities, and view settings from a file"
                >
                  <UploadIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Import</span>
                </button>
              </div>

              <button
                onClick={() => setShowHelpModal(true)}
                className={btnClass}
                title="How to use RDS4+"
              >
                <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">Help</span>
              </button>

              <a
                href="https://github.com/Aminul-Islam7/rds4plus"
                target="_blank"
                rel="noopener noreferrer"
                className={btnClass}
                title="Star RDS4+ on GitHub"
              >
                <GithubIcon className="h-3.5 w-3.5 shrink-0 self-center" />
                <span className="hidden sm:inline leading-none self-center">Star</span>
                <svg className="h-3.5 w-3.5 fill-yellow-400 hidden sm:block shrink-0 self-center" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </a>

              {/* Theme Toggle Button */}
              <ThemeToggle />
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        <CourseTable />
      </main>

      {/* Footer credit */}
      <footer className="mx-auto max-w-7xl px-3 sm:px-4 py-3 flex justify-end">
        <a
          href="https://www.linkedin.com/in/aminul-islam7/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-600 dark:hover:text-slate-400 transition-colors group"
          title="Aminul Islam on LinkedIn"
        >
          <span>Created by Aminul Islam</span>
          {/* LinkedIn icon */}
          <svg className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-[#0A66C2] transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </footer>

      {/* Help / Guide Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onDontShowAgain={handleDontShowAgain}
      />

      {/* Floating Update Notification (if idle > 30m and data changed) */}
      <UpdateNotification />
    </div>
  );
}
