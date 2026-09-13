import { Course, TimeSlot, CourseData, DataMeta } from "../types/course";
import { parseTimeSlot } from "./parser";

/** Shape returned by RDS4 scraper / legacy BFF API */
interface BffCourseRow {
  Course: string;
  Section: string;
  Faculty: string;
  Time: string;
  Room: string;
  Seats?: string;
  Semester?: string;
  Prediction?: string;
  Records?: string;
}

/**
 * Format semester code (e.g. "263" -> "Fall 2026", "262" -> "Summer 2026", "261" -> "Spring 2026").
 */
export function formatSemesterCode(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{2})([123])$/);
  if (match) {
    const year = `20${match[1]}`;
    const termCode = match[2];
    const termMap: Record<string, string> = {
      "1": "Spring",
      "2": "Summer",
      "3": "Fall",
    };
    return `${termMap[termCode]} ${year}`;
  }
  return trimmed || "Fall 2026";
}

/**
 * Extract semester label from BFF rows.
 * Uses the Semester field of the first row that has it, or falls back to "Fall 2026".
 */
function extractSemesterFromRows(rows: BffCourseRow[]): string {
  for (const row of rows) {
    if (row.Semester && row.Semester.trim()) {
      return formatSemesterCode(row.Semester);
    }
  }
  return "Fall 2026";
}

const MONTH_MAP: Record<string, string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec"
};

/**
 * Format scraped date (e.g. "02:40 AM, 20th MAY") to style: "May 20, 2:40 AM"
 */
export function formatScrapedDate(scraped: string): string {
  const clean = scraped.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM),\s*(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+)$/i);
  if (!match) return scraped;

  const [, hourStr, minuteStr, period, dayStr, monthStr] = match;
  
  const hour = parseInt(hourStr, 10).toString();
  const minute = minuteStr;
  const ampm = period.toUpperCase();
  const day = parseInt(dayStr, 10).toString();
  
  const monthKey = monthStr.toLowerCase().substring(0, 3);
  const month = MONTH_MAP[monthKey] || (monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase());

  return `${month} ${day}, ${hour}:${minute} ${ampm}`;
}

/**
 * Format current date in "Jan 12, 2:43 AM" style
 */
export function formatCurrentDate(): string {
  const date = new Date();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Parse BFF API JSON array into structured CourseData.
 */
export function parseBffJson(json: BffCourseRow[], lastUpdated?: string, semesterHint?: string): CourseData {
  const courses: Course[] = [];
  const courseSet = new Set<string>();
  const semester = semesterHint ? formatSemesterCode(semesterHint) : extractSemesterFromRows(json);

  let index = 1;
  for (const row of json) {
    const courseCode = row.Course?.trim();
    if (!courseCode) continue;

    const sectionNum = parseInt(row.Section?.trim() ?? "0", 10);
    const faculty = row.Faculty?.trim() ?? "";
    const timeRaw = row.Time?.trim() ?? "";
    const room = row.Room?.trim() ?? "";
    const seats = row.Seats?.trim() ?? "";

    courseSet.add(courseCode);

    courses.push({
      id: `${courseCode}-${sectionNum}`,
      index: index++,
      courseCode,
      section: sectionNum,
      faculty,
      time: parseTimeSlot(timeRaw),
      room,
      seats,
    });
  }

  const meta: DataMeta = {
    lastUpdated: lastUpdated ? formatScrapedDate(lastUpdated) : formatCurrentDate(),
    semester,
    totalSections: courses.length,
    uniqueCourses: courseSet.size,
  };

  return { meta, courses };
}
