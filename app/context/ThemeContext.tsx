"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** The selected theme mode */
  theme: Theme;
  /** The effective active theme */
  resolvedTheme: ResolvedTheme;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "rds4plus_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage or system on mount
  useEffect(() => {
    let initialTheme: Theme = "system";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        initialTheme = saved;
      }
    } catch {}

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved: ResolvedTheme =
      initialTheme === "light"
        ? "light"
        : initialTheme === "dark"
        ? "dark"
        : mediaQuery.matches
        ? "dark"
        : "light";

    setThemeState(initialTheme);
    setResolvedTheme(resolved);
    setMounted(true);

    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const listener = (e: MediaQueryListEvent) => {
      // If user preference is system, follow OS scheme
      try {
        const currentSaved = localStorage.getItem(STORAGE_KEY);
        if (!currentSaved || currentSaved === "system") {
          const nextResolved = e.matches ? "dark" : "light";
          setResolvedTheme(nextResolved);
          if (nextResolved === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      } catch {}
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved: ResolvedTheme =
      newTheme === "light"
        ? "light"
        : newTheme === "dark"
        ? "dark"
        : mediaQuery.matches
        ? "dark"
        : "light";

    setResolvedTheme(resolved);
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    // Determine current state directly from root element to prevent any sync issues
    const root = document.documentElement;
    const currentIsDark = root.classList.contains("dark");
    const next: ResolvedTheme = currentIsDark ? "light" : "dark";

    setThemeState(next);
    setResolvedTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}

    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
