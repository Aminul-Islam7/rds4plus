"use client";

import React, { useEffect, useState } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PriorityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BackupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

export function HelpModal({ isOpen, onClose, onDontShowAgain }: HelpModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative z-10 w-full sm:max-w-2xl bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 flex items-start justify-between gap-4 shrink-0 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <InfoIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                How to use RDS4<span className="text-cyan-400">+</span>
              </h2>
              <p className="text-xs text-slate-400">
                NSU Advising Planner & Helper
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 sm:px-6 py-2 overflow-y-auto space-y-3.5 text-xs sm:text-sm text-slate-300">
          {/* Intro Box */}
          <div className="rounded-xl bg-slate-800/60 p-3 text-xs leading-relaxed text-slate-300">
            This tool helps you make a priority list of preferred faculties/sections in advance. When your advising slot opens, pick available sections based on your plan without panic.
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Priority System */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <PriorityIcon className="h-3.5 w-3.5" />
                </span>
                Priority Levels (1 to 99)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rank backup sections for each course. Higher priorities glow with dynamic colors so you can instantly decide plan B or C when a favorite section is not available.
              </p>
            </div>

            {/* Smart Search */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                  <SearchIcon className="h-3.5 w-3.5" />
                </span>
                Multi-Term Search
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combine course code, faculty initials, time, or days separated by spaces. Example: <span className="text-cyan-300 font-mono">cse115 rjp st</span>.
              </p>
            </div>

            {/* Save & Filter */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                  <PinIcon className="h-3.5 w-3.5" />
                </span>
                Pin Courses & Faculties
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <span className="text-white font-medium">Save</span> beside any <span className="font-semibold text-cyan-400">course</span> or <span className="font-medium text-emerald-400">faculty</span> to create one-click filter pills above the table.
              </p>
            </div>

            {/* Star Sections */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <StarIcon className="h-3.5 w-3.5" />
                </span>
                Star Favorite Sections
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Star specific sections with the star icon, then toggle{" "}
                <span className="inline-flex items-center gap-0.5 text-amber-300 font-medium">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  Starred
                </span>{" "}
                to focus solely on your shortlist.
              </p>
            </div>

            {/* Day Filtering */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <CalendarIcon className="h-3.5 w-3.5" />
                </span>
                Filter by Days
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quick-toggle standard pairings (<span className="text-white">ST</span>, <span className="text-white">MW</span>, <span className="text-white">RA</span>) or individual days to construct clash-free schedules.
              </p>
            </div>

            {/* Export / Backup */}
            <div className="rounded-xl bg-slate-800/80 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs sm:text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                  <BackupIcon className="h-3.5 w-3.5" />
                </span>
                Backup & Restore
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use <span className="text-white font-medium">Export</span> in the header to save filters, stars and priorities to a JSON file, to restore later or <span className="text-white font-medium">Import</span> on another device.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Modern Toggle Switch */}
        <div className="px-5 sm:px-6 py-3 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setDontShowAgain((prev) => !prev)}
            className="flex items-center gap-2.5 cursor-pointer select-none group text-left shrink-0"
          >
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                dontShowAgain ? "bg-cyan-500" : "bg-slate-800 group-hover:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  dontShowAgain ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </div>
            <span
              className={`text-xs whitespace-nowrap transition-colors ${
                dontShowAgain ? "text-slate-200 font-medium" : "text-slate-400 group-hover:text-slate-300"
              }`}
            >
              Don&apos;t show this again
            </span>
          </button>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0">
            <a
              href="https://www.linkedin.com/in/aminul-islam7/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1 group whitespace-nowrap"
              title="Aminul Islam on LinkedIn"
            >
              <span>Created by Aminul Islam</span>
              <svg className="h-2.5 w-2.5 shrink-0 text-slate-600 group-hover:text-[#0A66C2] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <button
              onClick={handleClose}
              className="text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              Got it, Let&apos;s Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
