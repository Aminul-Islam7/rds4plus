"use client";

import { useEffect, useState } from "react";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer eye contour */}
      <path
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pupil */}
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      {/* Catchlight highlight dot */}
      <circle cx="13.2" cy="10.8" r="1" fill="#ffffff" fillOpacity="0.75" />
    </svg>
  );
}

export function OnlineVisitors() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Persistent visitor ID shared across all tabs of same browser
    let visitorId = localStorage.getItem("rds4plus_vid");
    if (!visitorId) {
      visitorId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
      try {
        localStorage.setItem("rds4plus_vid", visitorId);
      } catch {
        // storage disabled or quota exceeded
      }
    }

    const ping = async () => {
      try {
        const res = await fetch(
          `/api/visitors?id=${encodeURIComponent(visitorId!)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setCount(data.count);
          }
        }
      } catch {
        // Silently ignore ping errors
      }
    };

    // Initial ping
    ping();

    // Heartbeat every 10 seconds for responsive updates
    const interval = setInterval(ping, 10000);

    // On visibility change or tab focus, ping immediately
    const handleActivity = () => {
      if (document.visibilityState === "visible") {
        ping();
      }
    };
    document.addEventListener("visibilitychange", handleActivity);
    window.addEventListener("focus", handleActivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleActivity);
      window.removeEventListener("focus", handleActivity);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-emerald-500/25 select-none shrink-0"
      title="Online visitors right now"
    >
      <EyeIcon className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" />
      <span className="text-slate-300 font-medium text-xs leading-none tabular-nums min-w-[1ch] text-center">
        {count !== null ? count : "..."}
      </span>
    </div>
  );
}
