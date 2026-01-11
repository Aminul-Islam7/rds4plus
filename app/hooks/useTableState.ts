"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Course } from "../types/course";

// Storage keys
const STORAGE_KEYS = {
  STARRED: "rds4plus_starred_sections",
  PRIORITIES: "rds4plus_priorities",
  SAVED_COURSES: "rds4plus_saved_courses",
  SAVED_FACULTIES: "rds4plus_saved_faculties",
  HIDDEN_COLUMNS: "rds4plus_hidden_columns",
};

// Day filter options
export const DAY_FILTERS = ["ST", "MW", "RA", "S", "T", "M", "W", "R", "A"] as const;
export type DayFilter = (typeof DAY_FILTERS)[number];

// Sort direction
export type SortDirection = "asc" | "desc";

// Column keys
export type ColumnKey = "index" | "courseCode" | "section" | "faculty" | "time" | "room" | "star" | "priority";

// Sort configuration for a column
export interface SortConfig {
  key: keyof Course | "priority";
  direction: SortDirection;
}

export interface TableState {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Starring
  starredSections: Set<string>;
  toggleStar: (courseId: string) => void;
  isStarred: (courseId: string) => boolean;

  // Priorities
  priorities: Map<string, number>;
  setPriority: (courseId: string, priority: number) => void;
  getPriority: (courseId: string) => number;

  // Saved filters
  savedCourses: Set<string>;
  savedFaculties: Set<string>;
  toggleSavedCourse: (courseCode: string) => void;
  toggleSavedFaculty: (faculty: string) => void;
  removeSavedCourse: (courseCode: string) => void;
  removeSavedFaculty: (faculty: string) => void;

  // Active filters
  activeCourseFilters: Set<string>;
  activeFacultyFilters: Set<string>;
  activeDayFilters: Set<DayFilter>;
  showStarredOnly: boolean;
  toggleCourseFilter: (courseCode: string) => void;
  toggleFacultyFilter: (faculty: string) => void;
  toggleDayFilter: (day: DayFilter) => void;
  toggleStarredOnly: () => void;
  clearAllFilters: () => void;

  // Sorting
  sortConfigs: SortConfig[];
  toggleSort: (key: keyof Course | "priority") => void;
  clearSorts: () => void;
  getSortIndex: (key: keyof Course | "priority") => number;
  getSortDirection: (key: keyof Course | "priority") => SortDirection | null;

  // Column visibility
  hiddenColumns: Set<ColumnKey>;
  toggleColumnVisibility: (column: ColumnKey) => void;
  isColumnVisible: (column: ColumnKey) => boolean;
  resetColumnVisibility: () => void;

  // Filtered & sorted data
  filteredCourses: Course[];
}

// Normalize string for case-insensitive comparison
function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

// Helper to get from localStorage
function getStoredSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function getStoredMap(key: string): Map<string, number> {
  if (typeof window === "undefined") return new Map();
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Map(Object.entries(JSON.parse(stored))) : new Map();
  } catch {
    return new Map();
  }
}

// Helper to save to localStorage
function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify([...set]));
}

function saveMap(key: string, map: Map<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Object.fromEntries(map)));
}

// Default hidden columns
const DEFAULT_HIDDEN_COLUMNS: ColumnKey[] = ["index"];

export function useTableState(courses: Course[]): TableState {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Starred sections (persisted)
  const [starredSections, setStarredSections] = useState<Set<string>>(new Set());

  // Priorities (persisted)
  const [priorities, setPriorities] = useState<Map<string, number>>(new Map());

  // Saved courses and faculties (persisted) - stored in normalized form
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [savedFaculties, setSavedFaculties] = useState<Set<string>>(new Set());

  // Active filters (session only) - stored in normalized form
  const [activeCourseFilters, setActiveCourseFilters] = useState<Set<string>>(new Set());
  const [activeFacultyFilters, setActiveFacultyFilters] = useState<Set<string>>(new Set());
  const [activeDayFilters, setActiveDayFilters] = useState<Set<DayFilter>>(new Set());
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Sorting
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: "priority", direction: "desc" }]);

  // Column visibility (persisted)
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_HIDDEN_COLUMNS));

  // Load persisted state on mount
  useEffect(() => {
    setStarredSections(getStoredSet(STORAGE_KEYS.STARRED));
    setPriorities(getStoredMap(STORAGE_KEYS.PRIORITIES));
    setSavedCourses(getStoredSet(STORAGE_KEYS.SAVED_COURSES));
    setSavedFaculties(getStoredSet(STORAGE_KEYS.SAVED_FACULTIES));
    
    const storedHiddenColumns = getStoredSet(STORAGE_KEYS.HIDDEN_COLUMNS);
    if (storedHiddenColumns.size === 0) {
      // Use defaults if nothing stored
      setHiddenColumns(new Set(DEFAULT_HIDDEN_COLUMNS));
    } else {
      setHiddenColumns(storedHiddenColumns as Set<ColumnKey>);
    }
  }, []);

  // Star functions
  const toggleStar = useCallback((courseId: string) => {
    setStarredSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      saveSet(STORAGE_KEYS.STARRED, newSet);
      return newSet;
    });
  }, []);

  const isStarred = useCallback(
    (courseId: string) => starredSections.has(courseId),
    [starredSections]
  );

  // Priority functions
  const setPriority = useCallback((courseId: string, priority: number) => {
    setPriorities((prev) => {
      const newMap = new Map(prev);
      if (priority === 0) {
        newMap.delete(courseId);
      } else {
        newMap.set(courseId, priority);
      }
      saveMap(STORAGE_KEYS.PRIORITIES, newMap);
      return newMap;
    });
  }, []);

  const getPriority = useCallback(
    (courseId: string) => priorities.get(courseId) || 0,
    [priorities]
  );

  // Saved course/faculty functions - normalize for case-insensitivity
  const toggleSavedCourse = useCallback((courseCode: string) => {
    const normalized = normalizeString(courseCode);
    setSavedCourses((prev) => {
      const newSet = new Set(prev);
      // Check if already exists (case-insensitive)
      let found = false;
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          found = true;
          break;
        }
      }
      if (!found) {
        newSet.add(courseCode); // Store original case
      }
      saveSet(STORAGE_KEYS.SAVED_COURSES, newSet);
      return newSet;
    });
  }, []);

  const toggleSavedFaculty = useCallback((faculty: string) => {
    const normalized = normalizeString(faculty);
    setSavedFaculties((prev) => {
      const newSet = new Set(prev);
      // Check if already exists (case-insensitive)
      let found = false;
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          found = true;
          break;
        }
      }
      if (!found) {
        newSet.add(faculty); // Store original case
      }
      saveSet(STORAGE_KEYS.SAVED_FACULTIES, newSet);
      return newSet;
    });
  }, []);

  const removeSavedCourse = useCallback((courseCode: string) => {
    const normalized = normalizeString(courseCode);
    setSavedCourses((prev) => {
      const newSet = new Set(prev);
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          break;
        }
      }
      saveSet(STORAGE_KEYS.SAVED_COURSES, newSet);
      return newSet;
    });
    setActiveCourseFilters((prev) => {
      const newSet = new Set(prev);
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          break;
        }
      }
      return newSet;
    });
  }, []);

  const removeSavedFaculty = useCallback((faculty: string) => {
    const normalized = normalizeString(faculty);
    setSavedFaculties((prev) => {
      const newSet = new Set(prev);
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          break;
        }
      }
      saveSet(STORAGE_KEYS.SAVED_FACULTIES, newSet);
      return newSet;
    });
    setActiveFacultyFilters((prev) => {
      const newSet = new Set(prev);
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          break;
        }
      }
      return newSet;
    });
  }, []);

  // Active filter toggles
  const toggleCourseFilter = useCallback((courseCode: string) => {
    setActiveCourseFilters((prev) => {
      const normalized = normalizeString(courseCode);
      const newSet = new Set(prev);
      let found = false;
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          found = true;
          break;
        }
      }
      if (!found) {
        newSet.add(courseCode);
      }
      return newSet;
    });
  }, []);

  const toggleFacultyFilter = useCallback((faculty: string) => {
    setActiveFacultyFilters((prev) => {
      const normalized = normalizeString(faculty);
      const newSet = new Set(prev);
      let found = false;
      for (const existing of prev) {
        if (normalizeString(existing) === normalized) {
          newSet.delete(existing);
          found = true;
          break;
        }
      }
      if (!found) {
        newSet.add(faculty);
      }
      return newSet;
    });
  }, []);

  const toggleDayFilter = useCallback((day: DayFilter) => {
    setActiveDayFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  }, []);

  const toggleStarredOnly = useCallback(() => {
    setShowStarredOnly((prev) => !prev);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveCourseFilters(new Set());
    setActiveFacultyFilters(new Set());
    setActiveDayFilters(new Set());
    setShowStarredOnly(false);
    setSearchQuery("");
  }, []);

  // Sorting functions
  const toggleSort = useCallback((key: keyof Course | "priority") => {
    setSortConfigs((prev) => {
      const existingIndex = prev.findIndex((s) => s.key === key);
      
      if (existingIndex === -1) {
        // Add new sort
        return [...prev, { key, direction: "asc" as SortDirection }];
      }
      
      const existing = prev[existingIndex];
      if (existing.direction === "asc") {
        // Change to desc
        const newConfigs = [...prev];
        newConfigs[existingIndex] = { ...existing, direction: "desc" as SortDirection };
        return newConfigs;
      }
      
      // Remove sort
      return prev.filter((_, i) => i !== existingIndex);
    });
  }, []);

  const clearSorts = useCallback(() => {
    setSortConfigs([]);
  }, []);

  const getSortIndex = useCallback(
    (key: keyof Course | "priority") => {
      const index = sortConfigs.findIndex((s) => s.key === key);
      return index === -1 ? -1 : index + 1;
    },
    [sortConfigs]
  );

  const getSortDirection = useCallback(
    (key: keyof Course | "priority") => {
      const config = sortConfigs.find((s) => s.key === key);
      return config?.direction || null;
    },
    [sortConfigs]
  );

  // Column visibility functions
  const toggleColumnVisibility = useCallback((column: ColumnKey) => {
    setHiddenColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      saveSet(STORAGE_KEYS.HIDDEN_COLUMNS, newSet as Set<string>);
      return newSet;
    });
  }, []);

  const isColumnVisible = useCallback(
    (column: ColumnKey) => !hiddenColumns.has(column),
    [hiddenColumns]
  );

  const resetColumnVisibility = useCallback(() => {
    setHiddenColumns(new Set());
    saveSet(STORAGE_KEYS.HIDDEN_COLUMNS, new Set());
  }, []);

  // Intelligent search - split by spaces and match all terms (case-insensitive)
  const matchesSearch = useCallback(
    (course: Course, query: string): boolean => {
      if (!query.trim()) return true;

      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = [
        course.courseCode,
        course.section.toString(),
        course.faculty,
        course.time.raw,
        course.room,
        course.index.toString(),
      ]
        .join(" ")
        .toLowerCase();

      // All terms must match somewhere (in any order)
      return terms.every((term) => searchableText.includes(term));
    },
    []
  );

  // Day filter matching
  const matchesDayFilter = useCallback(
    (course: Course, dayFilters: Set<DayFilter>): boolean => {
      if (dayFilters.size === 0) return true;

      const courseDays = course.time.raw.match(/^([A-Z]+)/)?.[1] || "";
      
      // Single day filters (length 1) require exact match
      const singleDayFilters = ["S", "M", "T", "W", "R", "A"];
      // Double day filters match if course contains all days in filter
      const doubleDayFilters = ["ST", "MW", "RA"];
      
      for (const filter of dayFilters) {
        if (singleDayFilters.includes(filter)) {
          // Single day filter: course days must exactly match this single day
          if (courseDays === filter) {
            return true;
          }
        } else if (doubleDayFilters.includes(filter)) {
          // Double day filter: course days must contain all days in the filter
          const filterDays = filter.split("");
          if (filterDays.every((d) => courseDays.includes(d))) {
            return true;
          }
        }
      }
      return false;
    },
    []
  );

  // Check if course matches active filters (case-insensitive)
  const matchesCourseFilter = useCallback(
    (course: Course, filters: Set<string>): boolean => {
      if (filters.size === 0) return true;
      const normalizedCourse = normalizeString(course.courseCode);
      for (const filter of filters) {
        if (normalizeString(filter) === normalizedCourse) {
          return true;
        }
      }
      return false;
    },
    []
  );

  const matchesFacultyFilter = useCallback(
    (course: Course, filters: Set<string>): boolean => {
      if (filters.size === 0) return true;
      const normalizedFaculty = normalizeString(course.faculty);
      for (const filter of filters) {
        if (normalizeString(filter) === normalizedFaculty) {
          return true;
        }
      }
      return false;
    },
    []
  );

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = courses.filter((course) => {
      // Search filter
      if (!matchesSearch(course, searchQuery)) return false;

      // Course filter (case-insensitive)
      if (!matchesCourseFilter(course, activeCourseFilters)) return false;

      // Faculty filter (case-insensitive)
      if (!matchesFacultyFilter(course, activeFacultyFilters)) return false;

      // Day filter
      if (!matchesDayFilter(course, activeDayFilters)) return false;

      // Starred only filter
      if (showStarredOnly && !starredSections.has(course.id)) return false;

      return true;
    });

    // Apply sorting
    if (sortConfigs.length > 0) {
      result = [...result].sort((a, b) => {
        for (const config of sortConfigs) {
          let comparison = 0;

          if (config.key === "priority") {
            const aPriority = priorities.get(a.id) || 0;
            const bPriority = priorities.get(b.id) || 0;
            comparison = aPriority - bPriority;
          } else if (config.key === "time") {
            comparison = a.time.startMinutes - b.time.startMinutes;
          } else {
            const aVal = a[config.key];
            const bVal = b[config.key];
            if (typeof aVal === "string" && typeof bVal === "string") {
              comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
            } else if (typeof aVal === "number" && typeof bVal === "number") {
              comparison = aVal - bVal;
            }
          }

          if (comparison !== 0) {
            return config.direction === "desc" ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [
    courses,
    searchQuery,
    activeCourseFilters,
    activeFacultyFilters,
    activeDayFilters,
    showStarredOnly,
    starredSections,
    sortConfigs,
    priorities,
    matchesSearch,
    matchesDayFilter,
    matchesCourseFilter,
    matchesFacultyFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    starredSections,
    toggleStar,
    isStarred,
    priorities,
    setPriority,
    getPriority,
    savedCourses,
    savedFaculties,
    toggleSavedCourse,
    toggleSavedFaculty,
    removeSavedCourse,
    removeSavedFaculty,
    activeCourseFilters,
    activeFacultyFilters,
    activeDayFilters,
    showStarredOnly,
    toggleCourseFilter,
    toggleFacultyFilter,
    toggleDayFilter,
    toggleStarredOnly,
    clearAllFilters,
    sortConfigs,
    toggleSort,
    clearSorts,
    getSortIndex,
    getSortDirection,
    hiddenColumns,
    toggleColumnVisibility,
    isColumnVisible,
    resetColumnVisibility,
    filteredCourses,
  };
}
