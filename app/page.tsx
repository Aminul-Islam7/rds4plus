"use client";

import { CourseTable } from "./components/CourseTable";
import { HelpModal } from "./components/HelpModal";
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

  // Calculate unique faculty count (case-insensitive) - accurate count
  const uniqueFacultyCount = useMemo(() => {
    if (!data?.courses) return 0;
    const seen = new Set<string>();
    data.courses.forEach((c) => {
      // Normalize faculty name for accurate deduplication
      const normalizedFaculty = c.faculty.toLowerCase().trim();
      if (normalizedFaculty) {
        seen.add(normalizedFaculty);
      }
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
    link.download = `rds4plus_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import localStorage data
  const handleImportData = () => {
    fileInputRef.current?.click();
  };

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
        // Reload to apply imported data
        window.location.reload();
      } catch (error) {
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-col items-center justify-center rounded-xl bg-slate-800 leading-none">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-xs sm:text-sm font-bold text-transparent">RDS4</span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-[10px] sm:text-[12px] font-semibold tracking-wider text-transparent">PLUS</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  RDS4<span className="text-cyan-400">+</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">NSU Advising Planner</p>
              </div>
            </div>

            {/* Right side: Semester, Stats, Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Semester Badge & Stats */}
              {data && (
                <>
                  {/* Semester Badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5">
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-cyan-300 font-medium text-xs">{data.meta.semester}</span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-2 sm:gap-3 rounded-lg bg-slate-800/80 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs">
                    <div className="text-center">
                      <span className="font-bold text-cyan-400">{data.meta.uniqueCourses}</span>
                      <span className="text-slate-400 ml-1">courses</span>
                    </div>
                    <div className="h-3 w-px bg-slate-700/60"></div>
                    <div className="text-center">
                      <span className="font-bold text-violet-400">{data.meta.totalSections}</span>
                      <span className="text-slate-400 ml-1">sections</span>
                    </div>
                    <div className="h-3 w-px bg-slate-700/60"></div>
                    <div className="text-center">
                      <span className="font-bold text-emerald-400">{uniqueFacultyCount}</span>
                      <span className="text-slate-400 ml-1">faculties</span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons: Export, Import, Help */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveData}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  title="Save your stars, priorities, and view settings"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span>Export Setup</span>
                </button>
                <button
                  onClick={handleImportData}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  title="Restore your stars, priorities, and view settings from a file"
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                  <span>Import Setup</span>
                </button>
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  title="How to use RDS4+"
                >
                  <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Help</span>
                </button>
                <a
                  href="https://github.com/Aminul-Islam7/rds4plus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                  title="Star RDS4+ on GitHub"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>Star on GitHub</span>
                  <svg className="h-3 w-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Course Table */}
        <CourseTable />
      </main>

      {/* Help / Guide Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
}
