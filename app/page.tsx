"use client";

import { CourseTable } from "./components/CourseTable";
import { useCourses } from "./context/CourseContext";

export default function Home() {
  const { data } = useCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-75 blur"></div>
                <div className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-slate-900 leading-none">
  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-sm font-bold text-transparent">RDS4</span>
  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-[12px] font-semibold tracking-wider text-transparent">PLUS</span>
</div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  RDS4<span className="text-cyan-400">+</span>
                </h1>
                <p className="text-sm text-slate-400">NSU Advising Planner</p>
              </div>
            </div>

            {/* Stats */}
            {data && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 rounded-xl bg-slate-800/50 px-5 py-3 border border-slate-700/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{data.meta.uniqueCourses.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Courses</div>
                  </div>
                  <div className="h-8 w-px bg-slate-700"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{data.meta.totalSections.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Sections</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Semester Badge */}
        {data && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 border border-cyan-500/30">
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-cyan-300 font-medium">{data.meta.semester}</span>
            </div>
            <span className="text-slate-500 text-sm">
              Data from RDS4 • Updated Jan 11, 10:57 PM
            </span>
          </div>
        )}

        {/* Course Table */}
        <CourseTable />
      </main>
    </div>
  );
}
