"use client";

import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/initial hydration, assume dark (default) or detect client root class
  const isDark = mounted 
    ? resolvedTheme === "dark" 
    : typeof document !== "undefined" 
    ? document.documentElement.classList.contains("dark") 
    : true;

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={toggleTheme}
      className={`relative flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-all duration-200 active:scale-90 cursor-pointer shrink-0 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <SunIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <MoonIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
