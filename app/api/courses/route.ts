import { NextResponse } from "next/server";
import { parseBffJson } from "@/app/lib/bffParser";
import { ApiResponse, CourseData } from "@/app/types/course";
import { promises as fs } from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────
const BFF_URL =
  "https://rds2-bff.vercel.app/api/courses?semester=262_v1.csv";

/** Server-side in-memory TTL cache (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── Cache State ──────────────────────────────────────────────────────────────
let cachedData: CourseData | null = null;
let cacheTimestamp = 0;

// ─── Fallback: local CSV (which is actually JSON from BFF) ────────────────────
async function loadFallbackData(): Promise<CourseData> {
  const filePath = path.join(process.cwd(), "data", "response.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const json = JSON.parse(raw);
  return parseBffJson(json);
}

// ─── Scrape update time from main page ────────────────────────────────────────
async function fetchUpdateTime(): Promise<string> {
  try {
    const res = await fetch("https://rds2-bff.vercel.app/", {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const match = html.match(/<span>UPDATED:\s*([^<]+)<\/span>/i);
    return match ? match[1].trim() : "";
  } catch (err) {
    console.warn("Failed to fetch update time from landing page:", err);
    return "";
  }
}

// ─── Live fetch from BFF ──────────────────────────────────────────────────────
async function fetchLiveData(): Promise<CourseData> {
  const [coursesRes, updateTime] = await Promise.all([
    fetch(BFF_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        Accept: "*/*",
        Referer: "https://rds2-bff.vercel.app/",
      },
    }),
    fetchUpdateTime(),
  ]);

  if (!coursesRes.ok) {
    throw new Error(`BFF responded ${coursesRes.status} ${coursesRes.statusText}`);
  }

  const json = await coursesRes.json();
  return parseBffJson(json, updateTime || undefined);
}

// ─── Main loader with TTL cache + fallback ────────────────────────────────────
async function getCourseData(): Promise<{ data: CourseData; source: string }> {
  const now = Date.now();

  // Serve from cache if fresh
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return { data: cachedData, source: "cache" };
  }

  // Try live fetch
  try {
    const live = await fetchLiveData();
    cachedData = live;
    cacheTimestamp = now;
    return { data: live, source: "live" };
  } catch (liveErr) {
    console.warn(
      "[courses] Live fetch failed, trying fallback:",
      liveErr instanceof Error ? liveErr.message : liveErr
    );

    // Serve stale cache if we have it (better than nothing)
    if (cachedData) {
      return { data: cachedData, source: "stale-cache" };
    }

    // Last resort: bundled local file
    try {
      const fallback = await loadFallbackData();
      // Don't update cacheTimestamp so next request retries live
      cachedData = fallback;
      return { data: fallback, source: "fallback" };
    } catch (fallbackErr) {
      throw new Error(
        `Both live fetch and fallback failed. Live: ${liveErr instanceof Error ? liveErr.message : liveErr}. Fallback: ${fallbackErr instanceof Error ? fallbackErr.message : fallbackErr}`
      );
    }
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse<ApiResponse<CourseData>>> {
  try {
    const { data, source } = await getCourseData();

    const response = NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });

    // Cache-Control: allow browsers/CDN to cache for 5 min, then revalidate
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=60"
    );
    // Custom header so we can debug which path was used
    response.headers.set("X-Data-Source", source);

    return response;
  } catch (error) {
    console.error("[courses] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load course data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
