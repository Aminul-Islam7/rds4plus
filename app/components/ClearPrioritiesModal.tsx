"use client";

import { useEffect } from "react";

interface ClearPrioritiesModalProps {
  isOpen: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearPrioritiesModal({
  isOpen,
  count,
  onClose,
  onConfirm,
}: ClearPrioritiesModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all">
      {/* Backdrop click outside */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 flex items-start justify-between gap-4 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Clear all priorities?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 py-3 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 p-3.5 space-y-2 leading-relaxed">
            <p>
              You currently have{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {count} {count === 1 ? "section" : "sections"}
              </span>{" "}
              assigned with priority ranks.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Clearing will reset all assigned priorities to default (unranked).
            </p>
          </div>

          <div className="rounded-xl bg-amber-500/10 dark:bg-amber-500/15 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">Tip:</span> If you want to keep a copy, use the{" "}
            <span className="font-semibold text-slate-900 dark:text-white">Export</span> button next to
            Columns to save your setup to a file first.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5 shrink-0 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Clear all priorities ({count})
          </button>
        </div>
      </div>
    </div>
  );
}
