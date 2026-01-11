import { Course, TimeSlot, CourseData, DataMeta } from "../types/course";

/**
 * Parse the time string into a structured TimeSlot object
 */
export function parseTimeSlot(timeStr: string): TimeSlot {
  const raw = timeStr.trim();
  
  const defaultSlot: TimeSlot = {
    raw,
    days: [],
    startTime: "",
    endTime: "",
    startMinutes: 0,
    endMinutes: 0,
  };

  if (!raw || raw === "TBA") {
    return { ...defaultSlot, days: ["TBA"] };
  }

  const match = raw.match(/^([A-Z]+)\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  
  if (!match) {
    return defaultSlot;
  }

  const [, daysStr, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
  
  const dayMap: Record<string, string> = {
    'M': 'Mon', 'T': 'Tue', 'W': 'Wed', 'R': 'Thu', 'A': 'Fri', 'S': 'Sun',
  };
  
  const days = daysStr.split('').map(d => dayMap[d] || d);
  
  const convert24Hour = (hour: string, min: string, period: string): string => {
    let h = parseInt(hour, 10);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${min}`;
  };

  const startTime24 = convert24Hour(startHour, startMin, startPeriod);
  const endTime24 = convert24Hour(endHour, endMin, endPeriod);
  
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  return {
    raw,
    days,
    startTime: startTime24,
    endTime: endTime24,
    startMinutes: toMinutes(startTime24),
    endMinutes: toMinutes(endTime24),
  };
}

/**
 * Format time for display: "2:40 - 4:10 PM" (matching RDS4 style)
 */
export function formatTimeDisplay(time: TimeSlot): { days: string; timing: string } {
  if (!time.raw || time.days.includes("TBA")) {
    return { days: "TBA", timing: "" };
  }

  const dayMatch = time.raw.match(/^([A-Z]+)/);
  const days = dayMatch ? dayMatch[1] : "";

  const timeMatch = time.raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) {
    return { days, timing: time.raw.replace(/^[A-Z]+\s*/, "") };
  }

  const [, startH, startM, , endH, endM, endPeriod] = timeMatch;
  
  const startHour = parseInt(startH, 10);
  const endHour = parseInt(endH, 10);
  
  const timing = `${startHour}:${startM} - ${endHour}:${endM} ${endPeriod.toUpperCase()}`;
  
  return { days, timing };
}

/**
 * Extract semester info from the page
 */
export function extractSemester(html: string): string {
  const match = html.match(/Offered Course List \((.*?)\)/i);
  return match ? match[1].replace(/<!--.*?-->/g, '').trim() : 'Unknown';
}

/**
 * Parse the complete HTML response into structured course data
 */
export function parseCoursesFromHtml(html: string): CourseData {
  const courses: Course[] = [];
  const semester = extractSemester(html);
  
  const normalizedHtml = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const tbodyMatch = normalizedHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  
  if (!tbodyMatch) {
    console.warn("Could not find <tbody> in HTML");
    return { meta: { lastUpdated: new Date().toISOString(), semester, totalSections: 0, uniqueCourses: 0 }, courses: [] };
  }
  
  const tbody = tbodyMatch[1];
  const rows = tbody.split(/<tr>/i).slice(1);
  
  const courseSet = new Set<string>();
  
  for (const row of rows) {
    const tdMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    
    if (!tdMatches || tdMatches.length < 7) continue;
    
    const cells = tdMatches.map(td => {
      const content = td.replace(/<td[^>]*>/i, '').replace(/<\/td>/i, '');
      return content.trim();
    });
    
    const indexStr = cells[0].replace('.', '');
    const index = parseInt(indexStr, 10);
    if (isNaN(index)) continue;
    
    const courseCode = cells[1].trim();
    const section = parseInt(cells[2].trim(), 10);
    const faculty = cells[3].trim();
    const timeRaw = cells[4].trim();
    const room = cells[5].trim();

    if (!courseCode) continue;
    
    courseSet.add(courseCode);

    courses.push({
      id: `${courseCode}-${section}`,
      index,
      courseCode,
      section,
      faculty,
      time: parseTimeSlot(timeRaw),
      room,
    });
  }

  const meta: DataMeta = {
    lastUpdated: new Date().toISOString(),
    semester,
    totalSections: courses.length,
    uniqueCourses: courseSet.size,
  };

  return { meta, courses };
}
