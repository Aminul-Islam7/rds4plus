/**
 * Standalone scraper for RDS4 Offered Courses.
 * Bypasses Cloudflare bot challenges using Playwright headless Chromium.
 *
 * Usage:  node scripts/scrape_courses.mjs
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const RDS4_URL = "https://rds4.northsouth.ac.bd/offered_courses";

// ─── Direct HTTP Fetch Fallback ───────────────────────────────────────────────
async function tryDirectFetch() {
  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua":
      '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };

  try {
    const res = await fetch(RDS4_URL, { headers: browserHeaders });
    if (res.ok) {
      const html = await res.text();
      if (html.includes("<tbody>") && html.includes("Offered Course List")) {
        console.log("✅ Direct HTTP fetch succeeded");
        return parseCoursesFromHTML(html);
      }
    }
    console.warn(`⚠️ Direct fetch got ${res.status} ${res.statusText}`);
  } catch (err) {
    console.warn(`⚠️ Direct fetch error: ${err.message}`);
  }
  return null;
}

// ─── Playwright Scraper ───────────────────────────────────────────────────────
async function scrapeWithPlaywright() {
  console.log("🌐 Launching Playwright browser...");
  const { chromium } = await import("playwright");

  const isWindows = process.platform === "win32";
  const userDataDir = join(PROJECT_ROOT, ".browser_profile");
  mkdirSync(userDataDir, { recursive: true });

  let context = null;
  let browser = null;

  if (isWindows) {
    try {
      context = await chromium.launchPersistentContext(userDataDir, {
        channel: "chrome",
        headless: false,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--window-position=-2400,-2400",
          "--window-size=1280,800",
          "--no-first-run",
          "--no-default-browser-check",
        ],
        viewport: { width: 1280, height: 800 },
      });
    } catch (err) {
      console.warn(`⚠️ Could not launch persistent Chrome: ${err.message}`);
    }
  }

  if (!context) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });
    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });
  }

  try {
    const page = context.pages()[0] || (await context.newPage());
    console.log("🌐 Navigating to RDS4...");
    await page.goto(RDS4_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log(`🌐 Waiting for course table (current title: "${await page.title()}")...`);

    // Allow Cloudflare verification challenge to settle if present
    for (let i = 0; i < 20; i++) {
      const title = await page.title();
      if (!title.includes("Just a moment") && !title.includes("Security verification")) {
        break;
      }
      await page.waitForTimeout(1000);
    }

    await page.waitForSelector("tbody tr", { timeout: 30000 });

    // Extract pre-parsed rows directly from the page's DataTables instance
    const pageData = await page.evaluate(() => {
      const tables =
        typeof jQuery !== "undefined" && jQuery.fn.dataTable
          ? jQuery.fn.dataTable.tables(true)
          : [];
      if (!tables.length) return null;

      const dt = jQuery(tables[0]).DataTable();
      const rawRows = dt.rows().data().toArray();

      const bodyText = document.body.innerText || "";
      const sm = bodyText.match(
        /Offered Course List\s*(?:&mdash;|—)\s*([^\n\r]+)/i
      );
      const syncM = bodyText.match(/Last Synced:\s*([^\n\r]+)/i);

      return {
        rawRows,
        semester: sm ? sm[1].trim() : "",
        lastSynced: syncM ? syncM[1].trim() : "",
      };
    });

    if (pageData && pageData.rawRows && pageData.rawRows.length > 0) {
      console.log(`✅ Extracted ${pageData.rawRows.length} rows from DataTable API`);
      const courses = pageData.rawRows.map((row) => ({
        Course: String(row[1] || "").trim(),
        Section: String(row[2] || "").trim(),
        Faculty: String(row[3] || "").trim(),
        Time: String(row[4] || "").replace(/\s+/g, " ").trim(),
        Room: String(row[5] || "").replace(/\s+/g, " ").trim(),
        Seats: String(row[6] || "").replace(/\s+/g, " ").trim(),
        Semester: "",
        Prediction: "",
        Records: "",
      }));

      return {
        courses,
        semester: pageData.semester || "Fall 2026",
        lastSynced: pageData.lastSynced || "",
      };
    }

    // Fallback: parse raw HTML from DOM if DataTable wasn't initialized
    const html = await page.content();
    return parseCoursesFromHTML(html);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// ─── Parse HTML table rows (regex fallback) ───────────────────────────────────
function parseCoursesFromHTML(html) {
  const courses = [];

  const semesterMatch = html.match(
    /Offered Course List\s*(?:&mdash;|—)\s*(.+?)<\/h1>/i
  );
  const semester = semesterMatch ? semesterMatch[1].trim() : "";

  const syncMatch = html.match(/Last Synced:\s*(.+?)(?:\s*<|$)/im);
  const lastSynced = syncMatch ? syncMatch[1].trim() : "";

  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    throw new Error("Could not find <tbody> in HTML");
  }

  const tbody = tbodyMatch[1];
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHTML = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowHTML)) !== null) {
      cells.push(tdMatch[1].trim());
    }

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

  return { courses, semester, lastSynced };
}

// ─── Exported function for use by local daemon or other scripts ─────────────
export async function fetchRDS4Courses() {
  let result = await tryDirectFetch();
  if (!result || !result.courses || result.courses.length === 0) {
    result = await scrapeWithPlaywright();
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Fetching courses from RDS4...");

  const { courses, semester, lastSynced } = await fetchRDS4Courses();

  console.log(
    `✅ Parsed ${courses.length} course sections (semester: ${semester})`
  );
  console.log(`🕐 Last synced: ${lastSynced}`);

  if (courses.length === 0) {
    throw new Error("No courses parsed — aborting to prevent data loss");
  }

  const dataDir = join(PROJECT_ROOT, "data");
  mkdirSync(dataDir, { recursive: true });

  const responsePath = join(dataDir, "response.json");
  const lastUpdatedPath = join(dataDir, "last_updated.json");
  const newCoursesJson = JSON.stringify(courses, null, 2);

  let existingCourses = "";
  if (existsSync(responsePath)) {
    try {
      existingCourses = readFileSync(responsePath, "utf-8");
    } catch {}
  }

  // If courses are identical, skip writing to avoid generating unnecessary git diffs
  if (existingCourses.trim() === newCoursesJson.trim()) {
    console.log("ℹ️ Course data and sections are identical. Skipping file write.");
    console.log("\n🎉 Done (no changes)!");
    return;
  }

  // Write response.json
  writeFileSync(responsePath, newCoursesJson, "utf-8");
  console.log(`📝 Wrote ${responsePath} (${courses.length} entries)`);

  // Write last_updated.json with exact scrape time in Asia/Dhaka timezone
  const scrapeDate = new Date();
  const scrapedTime = scrapeDate.toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const cleanSynced = (lastSynced || "").replace(/\s*GMT[+-]?\d*/gi, "").trim();

  const lastUpdated = {
    scraped_at: scrapedTime,
    scraped_iso: scrapeDate.toISOString(),
    synced_at: cleanSynced,
    semester: semester,
    source: "rds4.northsouth.ac.bd",
    total_sections: courses.length,
  };
  writeFileSync(lastUpdatedPath, JSON.stringify(lastUpdated, null, 2), "utf-8");
  console.log(`📝 Wrote ${lastUpdatedPath} (scraped at: ${scrapedTime})`);

  console.log("\n🎉 Done!");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error("❌ Scrape failed:", err.message);
    process.exit(1);
  });
}
