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
        stroke="#10b981"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pupil */}
      <circle cx="12" cy="12" r="3.4" fill="#10b981" />
      {/* Catchlight highlight dot */}
      <circle cx="13.2" cy="10.8" r="1.1" fill="#ffffff" />
    </svg>
  );
}

export function OnlineVisitors() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Generate or retrieve persistent session ID
    let visitorId = sessionStorage.getItem("rds4plus_vid");
    if (!visitorId) {
      visitorId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem("rds4plus_vid", visitorId);
    }

    const ping = async () => {
      try {
        const res = await fetch(`/api/visitors?id=${encodeURIComponent(visitorId!)}`, {
          cache: "no-store",
        });
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

    // Heartbeat every 25 seconds
    const interval = setInterval(ping, 25000);

    // On visibility change, ping if user comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ping();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Leave beacon on page unload
    const handleUnload = () => {
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ id: visitorId, action: "leave" })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/visitors", blob);
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#0b1410] border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.22)] select-none shrink-0 transition-all duration-300"
      title="Online visitors right now"
    >
      <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
      <span className="text-white font-bold text-xs sm:text-sm leading-none tabular-nums min-w-[1ch] text-center">
        {count !== null ? count : "..."}
      </span>
    </div>
  );
}
