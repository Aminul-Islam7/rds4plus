/**
 * Represents a single course section
 */
export interface Course {
  /** Unique identifier combining course code and section */
  id: string;
  /** Row index from the original table */
  index: number;
  /** Course code (e.g., "ACT201", "CSE115") */
  courseCode: string;
  /** Section number */
  section: number;
  /** Faculty initials/name */
  faculty: string;
  /** Time slot info */
  time: TimeSlot;
  /** Room/location */
  room: string;
}

/**
 * Parsed time slot information
 */
export interface TimeSlot {
  /** Original time string from the source */
  raw: string;
  /** Days of the week (abbreviated: Mon, Tue, etc.) */
  days: string[];
  /** Start time in 24-hour format (e.g., "14:40") */
  startTime: string;
  /** End time in 24-hour format (e.g., "16:10") */
  endTime: string;
  /** Start time for comparison (minutes from midnight) */
  startMinutes: number;
  /** End time for comparison (minutes from midnight) */
  endMinutes: number;
}

/**
 * Metadata about the data
 */
export interface DataMeta {
  /** When the data was loaded */
  lastUpdated: string;
  /** Semester info extracted from the page */
  semester: string;
  /** Total number of course sections */
  totalSections: number;
  /** Number of unique courses */
  uniqueCourses: number;
}

/**
 * Complete course data response
 */
export interface CourseData {
  /** Metadata about the data */
  meta: DataMeta;
  /** Array of all course sections */
  courses: Course[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
