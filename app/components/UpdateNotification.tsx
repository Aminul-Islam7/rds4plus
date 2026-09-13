"use client";

import { useEffect, useState, useRef } from "react";
import { useCourses } from "../context/CourseContext";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60s once threshold is reached

declare global {
  interface Window {
    __testUpdateNotice?: () => void;
  }
}

export function UpdateNotification() {
  const { data, refresh, isRefreshing } = useCourses();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateTime, setUpdateTime] = useState<string | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  // Track when current data was loaded or refreshed
  const loadedAtRef = useRef<number>(Date.now());
  const currentMetaRef = useRef(data?.meta);
  const prevLastUpdatedRef = useRef<string | undefined>(undefined);

  // Keep refs in sync with data
  useEffect(() => {
    if (data?.meta) {
      currentMetaRef.current = data.meta;
      if (prevLastUpdatedRef.current && prevLastUpdatedRef.current !== data.meta.lastUpdated) {
        setHasUpdate(false);
      }
      prevLastUpdatedRef.current = data.meta.lastUpdated;
      loadedAtRef.current = Date.now();
    }
  }, [data]);

  // Check for updates if page has been open > 30 minutes without refresh
  useEffect(() => {
    // 1. Secret testing support (URL param ?testUpdate=true or console window.__testUpdateNotice())
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("testUpdate") === "true" || params.get("testUpdateNotice") === "true") {
        setUpdateTime("Just now (Test Mode)");
        setHasUpdate(true);
      }

      window.__testUpdateNotice = () => {
        setUpdateTime("Simulated RDS4 Update");
        setHasUpdate(true);
        console.log("🔔 [RDS4+] Test update notification triggered!");
      };
    }

    const checkServerForUpdates = async () => {
      const elapsed = Date.now() - loadedAtRef.current;
      // Only check if user has not reloaded or refreshed for more than 30 minutes
      if (elapsed < THIRTY_MINUTES_MS) {
        return;
      }

      try {
        const res = await fetch(`/api/courses?check=1&_t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const json = await res.json();
        if (!json?.success || !json?.meta) return;

        const remoteLastUpdated = json.meta.lastUpdated;
        const remoteSections = json.meta.totalSections;

        const currentLastUpdated = currentMetaRef.current?.lastUpdated;
        const currentSections = currentMetaRef.current?.totalSections;

        const isDifferent =
          (remoteLastUpdated && remoteLastUpdated !== currentLastUpdated) ||
          (remoteSections && currentSections && remoteSections !== currentSections);

        if (isDifferent && remoteLastUpdated !== dismissedKey) {
          setUpdateTime(remoteLastUpdated || "Recently");
          setHasUpdate(true);
        }
      } catch (err) {
        // Silent fail for background check
      }
    };

    const interval = setInterval(checkServerForUpdates, CHECK_INTERVAL_MS);

    // Also check on tab focus if > 30 mins elapsed
    const handleFocus = () => {
      if (Date.now() - loadedAtRef.current >= THIRTY_MINUTES_MS) {
        checkServerForUpdates();
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dismissedKey]);

  if (!hasUpdate) return null;

  const handleRefresh = async () => {
    setHasUpdate(false);
    await refresh();
  };

  const handleDismiss = () => {
    if (updateTime) {
      setDismissedKey(updateTime);
    }
    setHasUpdate(false);
  };

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 transition-all duration-300 transform translate-y-0 opacity-100"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.95),0_4px_20px_rgba(0,0,0,0.85)] p-4 text-slate-800 dark:text-slate-100 flex items-start gap-3 select-none">
        {/* Contrasting icon container - no borders */}
        <div className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 p-2.5 rounded-xl shrink-0 flex items-center justify-center">
          <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>

        {/* Text and Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              RDS4 Data Updated
            </h4>
            <span className="text-[10px] font-medium text-cyan-700 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full shrink-0">
              New Data
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Course changes were detected on RDS4. Would you like to update the table now?
          </p>

          {/* Action buttons - styled purely with background colors for contrast, NO borders */}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isRefreshing ? "Updating..." : "Refresh table"}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-all active:scale-95 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
