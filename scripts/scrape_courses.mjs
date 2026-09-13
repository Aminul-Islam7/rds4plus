#!/usr/bin/env node
/**
 * scrape_courses.mjs
 * ------------------
 * Scrapes offered courses from https://rds4.northsouth.ac.bd/offered_courses
 * and writes BFF-compatible JSON to data/response.json + data/last_updated.json.
 *
 * Zero external dependencies — uses Node built-in fetch + regex HTML parsing.
 *
 * Usage:  node scripts/scrape_courses.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const RDS4_URL = "https://rds4.northsouth.ac.bd/offered_courses";

// ─── Fetch HTML ───────────────────────────────────────────────────────────────
async function fetchHTML() {
  const res = await fetch(RDS4_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`RDS4 responded ${res.status} ${res.statusText}`);
  }

  return res.text();
}

// ─── Parse HTML table rows ────────────────────────────────────────────────────
function parseCoursesFromHTML(html) {
  const courses = [];

  // Extract semester from page title: "Offered Course List — Fall 2026"
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
    throw new Error("Could not find <tbody> in HTML");
  }

  const tbody = tbodyMatch[1];

  // Match each <tr>...</tr>
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHTML = rowMatch[1];

    // Extract all <td> values
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch;

    while ((tdMatch = tdRegex.exec(rowHTML)) !== null) {
      cells.push(tdMatch[1].trim());
    }

    // Expect 7 columns: #, Course, Section, Faculty, Time, Room, Seats
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

// ─── Format sync time for last_updated.json ───────────────────────────────────
function formatSyncTime(lastSynced) {
  // Input: "13 Sep 2026, 12:43 PM GMT+6"
  // Extract just the time part: "12:43 PM"
  const timeMatch = lastSynced.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  return timeMatch ? timeMatch[1].trim() : "";
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Fetching courses from RDS4...");
  const html = await fetchHTML();
  console.log(`📦 Downloaded ${(html.length / 1024).toFixed(0)} KB of HTML`);

  const { courses, semester, lastSynced } = parseCoursesFromHTML(html);
  console.log(
    `✅ Parsed ${courses.length} course sections (semester: ${semester})`
  );
  console.log(`🕐 Last synced: ${lastSynced}`);

  if (courses.length === 0) {
    throw new Error("No courses parsed — aborting to prevent data loss");
  }

  // Ensure data/ directory exists
  const dataDir = join(PROJECT_ROOT, "data");
  mkdirSync(dataDir, { recursive: true });

  // Write response.json
  const responsePath = join(dataDir, "response.json");
  writeFileSync(responsePath, JSON.stringify(courses, null, 2), "utf-8");
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
  const lastUpdatedPath = join(dataDir, "last_updated.json");
  writeFileSync(lastUpdatedPath, JSON.stringify(lastUpdated, null, 2), "utf-8");
  console.log(`📝 Wrote ${lastUpdatedPath} (scraped at: ${scrapedTime})`);

  console.log("\n🎉 Done!");
}

main().catch((err) => {
  console.error("❌ Scrape failed:", err.message);
  process.exit(1);
});
