"use client";

import { CourseTable } from "./components/CourseTable";
import { useCourses } from "./context/CourseContext";
import { useMemo, useRef } from "react";

// Storage keys (must match useTableState.ts)
const STORAGE_KEYS = {
  STARRED_SECTIONS: "rds4plus_starred_sections",
  PRIORITIES: "rds4plus_priorities",
  SAVED_COURSES: "rds4plus_saved_courses",
  SAVED_FACULTIES: "rds4plus_saved_faculties",
  HIDDEN_COLUMNS: "rds4plus_hidden_columns",
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

export default function Home() {
  const { data } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 blur"></div>
                <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 flex-col items-center justify-center rounded-xl bg-slate-900 leading-none">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-xs sm:text-sm font-bold text-transparent">RDS4</span>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-[10px] sm:text-[12px] font-semibold tracking-wider text-transparent">PLUS</span>
                </div>
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
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-cyan-500/30">
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-cyan-300 font-medium text-xs">{data.meta.semester}</span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-2 sm:gap-3 rounded-lg bg-slate-800/50 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-slate-700/50 text-xs">
                    <div className="text-center">
                      <span className="font-bold text-cyan-400">{data.meta.uniqueCourses}</span>
                      <span className="text-slate-500 ml-1">courses</span>
                    </div>
                    <div className="h-3 w-px bg-slate-700"></div>
                    <div className="text-center">
                      <span className="font-bold text-violet-400">{data.meta.totalSections}</span>
                      <span className="text-slate-500 ml-1">sections</span>
                    </div>
                    <div className="h-3 w-px bg-slate-700"></div>
                    <div className="text-center">
                      <span className="font-bold text-emerald-400">{uniqueFacultyCount}</span>
                      <span className="text-slate-500 ml-1">faculties</span>
                    </div>
                  </div>
                </>
              )}

              {/* Save/Import Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveData}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
                  title="Download saved data"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span>Save Data</span>
                </button>
                <button
                  onClick={handleImportData}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
                  title="Import saved data"
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                  <span>Import Data</span>
                </button>
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
    </div>
  );
}
