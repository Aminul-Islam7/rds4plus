/**
 * RDS4+ Local Background Sync Daemon
 *
 * Runs locally on your PC every 5 minutes.
 * Scrapes RDS4, checks if the course catalog or sync timestamp is newer/different
 * than the server, and automatically commits & pushes to GitHub if updated.
 *
 * Usage:
 *   node scripts/local_sync_daemon.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { fetchRDS4Courses } from "./scrape_courses.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Ensure logs directory exists
const LOG_DIR = join(PROJECT_ROOT, "logs");
mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, "sync_daemon.log");

function log(msg) {
  const ts = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_FILE, line + "\n", "utf-8");
  } catch {}
}

function runGit(cmd) {
  return execSync(cmd, {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

async function fetchRemoteMetadata() {
  try {
    const url = `https://raw.githubusercontent.com/Aminul-Islam7/rds4plus/main/data/last_updated.json?_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    log(`⚠️ Remote metadata fetch error: ${err.message}`);
  }
  return null;
}

async function syncCycle() {
  log("🔍 Checking RDS4 for course updates...");

  let scraped;
  try {
    scraped = await fetchRDS4Courses();
  } catch (err) {
    log(`❌ Scrape error: ${err.message}`);
    return;
  }

  const { courses, semester, lastSynced } = scraped;
  if (!courses || courses.length === 0) {
    log("⚠️ No courses returned from RDS4. Skipping sync.");
    return;
  }

  const cleanSynced = (lastSynced || "").replace(/\s*GMT[+-]?\d*/gi, "").trim();

  // Load existing local response.json
  const dataDir = join(PROJECT_ROOT, "data");
  mkdirSync(dataDir, { recursive: true });
  const responsePath = join(dataDir, "response.json");
  const lastUpdatedPath = join(dataDir, "last_updated.json");

  let existingLocalCourses = "";
  if (existsSync(responsePath)) {
    try {
      existingLocalCourses = readFileSync(responsePath, "utf-8");
    } catch {}
  }

  let existingLocalMeta = null;
  if (existsSync(lastUpdatedPath)) {
    try {
      existingLocalMeta = JSON.parse(readFileSync(lastUpdatedPath, "utf-8"));
    } catch {}
  }

  // Load remote GitHub metadata for comparison
  const remoteMeta = await fetchRemoteMetadata();

  const newCoursesJson = JSON.stringify(courses, null, 2);
  const coursesChangedLocally = existingLocalCourses.trim() !== newCoursesJson.trim();

  // Compare with remote: did sections count change or did RDS4 synced_at change?
  const remoteSections = remoteMeta?.total_sections ?? 0;
  const remoteSyncedAt = remoteMeta?.synced_at ?? "";

  const hasNewSyncTime = cleanSynced && remoteSyncedAt && cleanSynced !== remoteSyncedAt;
  const hasSectionCountChange = remoteSections > 0 && courses.length !== remoteSections;

  log(`📊 Scraped: ${courses.length} sections | Last Synced: "${cleanSynced}" | Remote: "${remoteSyncedAt}" (${remoteSections} sections)`);

  const shouldUpdate =
    coursesChangedLocally ||
    hasNewSyncTime ||
    hasSectionCountChange ||
    !remoteMeta;

  if (!shouldUpdate) {
    log(`✅ Server data is already up-to-date. (Next check in 5 mins)`);
    return;
  }

  log("🔄 Course data or sync time is updated! Saving and pushing to server...");

  // Write files
  const scrapeDate = new Date();
  const scrapedTime = scrapeDate.toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const lastUpdatedData = {
    scraped_at: scrapedTime,
    scraped_iso: scrapeDate.toISOString(),
    synced_at: cleanSynced,
    semester: semester || existingLocalMeta?.semester || "Fall 2026",
    source: "local-pc-daemon",
    total_sections: courses.length,
  };

  writeFileSync(responsePath, newCoursesJson, "utf-8");
  writeFileSync(lastUpdatedPath, JSON.stringify(lastUpdatedData, null, 2), "utf-8");

  // Push to Git
  try {
    log("📝 Staging updated data...");
    runGit("git add data/response.json data/last_updated.json");

    log("📥 Pulling latest remote changes...");
    runGit("git pull --rebase --autostash origin main");
    runGit("git add data/response.json data/last_updated.json");

    let status = "";
    try {
      status = runGit("git diff --staged --name-only");
    } catch {}

    if (!status) {
      log("ℹ️ No git changes after rebase. Server already has this data.");
      return;
    }

    runGit('git commit -m "chore(data): sync latest RDS4 course data [skip ci]"');
    log("🚀 Pushing to GitHub main...");
    runGit("git push origin main");
    log(`🎉 Successfully updated server with ${courses.length} courses! (Scraped at ${scrapedTime})`);
  } catch (gitErr) {
    log(`❌ Git sync error: ${gitErr.message}`);
    // If rebase in progress, abort to keep working tree clean
    try {
      runGit("git rebase --abort");
    } catch {}
  }
}

log("==================================================");
log("🚀 RDS4+ Local Sync Daemon started (5 min interval)");
log("==================================================");

// Run first cycle immediately
syncCycle().finally(() => {
  // Schedule recurring runs
  setInterval(() => {
    syncCycle().catch((err) => log(`❌ Cycle error: ${err.message}`));
  }, INTERVAL_MS);
});
