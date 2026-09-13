import { NextResponse } from "next/server";
import { parseBffJson } from "@/app/lib/bffParser";
import { ApiResponse, CourseData } from "@/app/types/course";
import { promises as fs } from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────
const RDS4_URL = "https://rds4.northsouth.ac.bd/offered_courses";

/** Server-side in-memory TTL cache (1 minute so scraper updates appear quickly) */
const CACHE_TTL_MS = 60 * 1000;

// ─── Cache State ──────────────────────────────────────────────────────────────
let cachedData: CourseData | null = null;
let cacheTimestamp = 0;

// ─── Fallback: remote GitHub or bundled JSON (kept fresh by local daemon & Actions) ──
async function loadFallbackData(): Promise<CourseData> {
  let localData: any = null;
  let localLu: any = null;

  try {
    const filePath = path.join(process.cwd(), "data", "response.json");
    const raw = await fs.readFile(filePath, "utf-8");
    localData = JSON.parse(raw);

    const luPath = path.join(process.cwd(), "data", "last_updated.json");
    const luRaw = await fs.readFile(luPath, "utf-8");
    localLu = JSON.parse(luRaw);
  } catch {
    // Bundled files missing or error reading
  }

  // Check GitHub raw for newer scrape (important on Vercel between deployments)
  try {
    const ghLuRes = await fetch(
      "https://raw.githubusercontent.com/Aminul-Islam7/rds4plus/main/data/last_updated.json",
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    );
    if (ghLuRes.ok) {
      const ghLu = await ghLuRes.json();
      const ghIso = new Date(ghLu.scraped_iso || 0).getTime();
      const localIso = new Date(localLu?.scraped_iso || 0).getTime();

      // If GitHub has a newer scrape than bundled local file
      if (ghIso > localIso || !localData) {
        const ghDataRes = await fetch(
          "https://raw.githubusercontent.com/Aminul-Islam7/rds4plus/main/data/response.json",
          { cache: "no-store", signal: AbortSignal.timeout(5000) }
        );
        if (ghDataRes.ok) {
          const ghData = await ghDataRes.json();
          const updateTime = ghLu?.scraped_at || ghLu?.scraped_iso || ghLu?.synced_at;
          return parseBffJson(ghData, updateTime, "263");
        }
      }
    }
  } catch {
    // GitHub fetch failed or timed out, fall through to bundled data
  }

  if (localData) {
    const updateTime = localLu?.scraped_at || localLu?.scraped_iso || localLu?.synced_at;
    return parseBffJson(localData, updateTime, "263");
  }

  throw new Error("No course data available locally or from GitHub");
}

// ─── Parse courses from RDS4 HTML ─────────────────────────────────────────────
interface RDS4ParseResult {
  courses: Array<{
    Course: string;
    Section: string;
    Faculty: string;
    Time: string;
    Room: string;
    Seats: string;
    Semester: string;
    Prediction: string;
    Records: string;
  }>;
  lastSynced: string;
  semester: string;
}

function parseRDS4HTML(html: string): RDS4ParseResult {
  const courses: RDS4ParseResult["courses"] = [];

  // Extract semester from page title
  const semesterMatch = html.match(
    /Offered Course List\s*(?:&mdash;|—)\s*(.+?)<\/h1>/i
  );
  const semester = semesterMatch ? semesterMatch[1].trim() : "";

  // Extract "Last Synced" timestamp
  const syncMatch = html.match(/Last Synced:\s*(.+?)(?:\s*<|$)/im);
  const lastSynced = syncMatch ? syncMatch[1].trim() : "";

  // Find <tbody> content
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    throw new Error("Could not find <tbody> in RDS4 HTML");
  }

  const tbody = tbodyMatch[1];
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHTML = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowHTML)) !== null) {
      cells.push(tdMatch[1].trim());
    }

    // 7 columns: #, Course, Section, Faculty, Time, Room, Seats
    if (cells.length >= 7) {
      const course = cells[1].trim();
      const section = cells[2].trim();
      const faculty = cells[3].trim();
      const time = cells[4].replace(/\s+/g, " ").trim();
      const room = cells[5].replace(/\s+/g, " ").trim();
      const seats = cells[6].replace(/\s+/g, " ").trim();

      if (course) {
        courses.push({
          Course: course,
          Section: section,
          Faculty: faculty,
          Time: time,
          Room: room,
          Seats: seats,
          Semester: "",
          Prediction: "",
          Records: "",
        });
      }
    }
  }

  return { courses, lastSynced, semester };
}

// ─── Extract semester code from semester string ───────────────────────────────
function getSemesterHintFromName(name: string): string {
  // "Fall 2026" → "263", "Summer 2026" → "262", "Spring 2026" → "261"
  const match = name.match(/(Spring|Summer|Fall)\s+(\d{4})/i);
  if (!match) return "263";

  const yearCode = match[2].slice(2); // "2026" → "26"
  const termMap: Record<string, string> = {
    spring: "1",
    summer: "2",
    fall: "3",
  };
  const termCode = termMap[match[1].toLowerCase()] || "3";
  return `${yearCode}${termCode}`;
}

// ─── Live fetch from RDS4 ─────────────────────────────────────────────────────
async function fetchLiveData(): Promise<CourseData> {
  const res = await fetch(RDS4_URL, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`RDS4 responded ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const { courses, lastSynced, semester } = parseRDS4HTML(html);

  if (courses.length === 0) {
    throw new Error("RDS4 returned empty course list");
  }

  const semesterHint = getSemesterHintFromName(semester);
  const scrapedTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return parseBffJson(courses, scrapedTime, semesterHint);
}

// ─── Main loader with TTL cache + fallback ────────────────────────────────────
async function getCourseData(): Promise<{ data: CourseData; source: string }> {
  const now = Date.now();

  // Serve from cache if fresh
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return { data: cachedData, source: "cache" };
  }

  // Try live fetch from RDS4
  try {
    const live = await fetchLiveData();
    cachedData = live;
    cacheTimestamp = now;
    return { data: live, source: "live" };
  } catch (liveErr) {
    console.warn(
      "[courses] Live RDS4 fetch failed, trying fallback:",
      liveErr instanceof Error ? liveErr.message : liveErr
    );

    // Serve stale cache if we have it (better than nothing)
    if (cachedData) {
      return { data: cachedData, source: "stale-cache" };
    }

    // Last resort: bundled or GitHub raw data
    try {
      const fallback = await loadFallbackData();
      cachedData = fallback;
      cacheTimestamp = now;
      return { data: fallback, source: "fallback" };
    } catch (fallbackErr) {
      throw new Error(
        `Both live fetch and fallback failed. Live: ${liveErr instanceof Error ? liveErr.message : liveErr}. Fallback: ${fallbackErr instanceof Error ? fallbackErr.message : fallbackErr}`
      );
    }
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const isCheck =
      url.searchParams.get("check") === "1" ||
      url.searchParams.get("meta") === "1";

    const { data, source } = await getCourseData();

    const payload = isCheck
      ? {
          success: true,
          meta: data.meta,
          timestamp: new Date().toISOString(),
        }
      : {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };

    const response = NextResponse.json(payload);

    // Disable aggressive browser caching so semester updates immediately
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
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
