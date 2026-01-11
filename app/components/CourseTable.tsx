"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useCourses } from "../context/CourseContext";
import { Course } from "../types/course";
import { formatTimeDisplay } from "../lib/parser";
import { useTableState, DAY_FILTERS, DayFilter, ColumnKey } from "../hooks/useTableState";

// Icons as components
function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function BookmarkIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v18l-7-3.5L5 22V4z" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// Priority selector component with -/+ buttons and relative coloring
function PrioritySelector({
  value,
  onChange,
  minVisible,
  maxVisible,
}: {
  value: number;
  onChange: (value: number) => void;
  minVisible: number;
  maxVisible: number;
}) {
  // Calculate relative color
  const getColorClass = () => {
    // Prevent division by zero
    if (maxVisible === minVisible) return "text-slate-400 bg-slate-800/50 border-slate-600/50";
    
    // Normalize value between 0 and 1 relative to visible range
    const normalized = (value - minVisible) / (maxVisible - minVisible);
    
    // Bucket into 5 distinct color levels
    if (normalized < 0.2) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (normalized < 0.4) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (normalized < 0.6) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    if (normalized < 0.8) return "text-teal-400 bg-teal-500/10 border-teal-500/30";
    return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  };

  const colorClass = value === 0 ? "text-slate-400 bg-slate-800/50 border-slate-600/50" : getColorClass();

  const handleDecrement = () => {
    if (value > -9) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < 99) onChange(value + 1);
  };

  return (
    <div className={`flex items-center gap-1 border rounded px-1 py-0.5 ${colorClass} transition-colors h-7`}>
      <button 
        onClick={handleDecrement}
        className="p-0.5 hover:text-white disabled:opacity-30 disabled:hover:text-current transition-colors cursor-pointer"
        disabled={value <= -9}
      >
        <MinusIcon className="h-3 w-3" />
      </button>
      <div className="w-5 text-center text-xs font-bold leading-none select-none">
        {value === 0 ? "-" : value}
      </div>
      <button 
        onClick={handleIncrement}
        className="p-0.5 hover:text-white disabled:opacity-30 disabled:hover:text-current transition-colors cursor-pointer"
        disabled={value >= 99}
      >
        <PlusIcon className="h-3 w-3" />
      </button>
    </div>
  );
}

// Sortable column header with visibility toggle
function SortableHeader({
  label,
  sortKey,
  columnKey,
  tableState,
  className,
  align = "center",
  headerRowHovered,
}: {
  label: string;
  sortKey: keyof Course | "priority";
  columnKey: ColumnKey;
  tableState: ReturnType<typeof useTableState>;
  className?: string;
  align?: "left" | "center" | "right";
  headerRowHovered: boolean;
}) {
  const sortIndex = tableState.getSortIndex(sortKey);
  const sortDirection = tableState.getSortDirection(sortKey);
  const isSorted = sortIndex > 0;
  
  // Count visible columns to ensure at least one is visible
  const visibleColumnsCount = 
    (tableState.isColumnVisible("courseCode") ? 1 : 0) +
    (tableState.isColumnVisible("section") ? 1 : 0) +
    (tableState.isColumnVisible("faculty") ? 1 : 0) +
    (tableState.isColumnVisible("time") ? 1 : 0) +
    (tableState.isColumnVisible("room") ? 1 : 0) +
    (tableState.isColumnVisible("index") ? 1 : 0) +
    (tableState.isColumnVisible("star") ? 1 : 0) +
    (tableState.isColumnVisible("priority") ? 1 : 0);

  const canHide = visibleColumnsCount > 1;

  // Get sort button text and icon
  const getSortDisplay = () => {
    if (!isSorted) {
      return { text: "Sort", icon: <ChevronUpIcon className="h-3 w-3" /> };
    }
    if (sortDirection === "asc") {
      return { text: "Asc", icon: <ChevronUpIcon className="h-3 w-3" /> };
    }
    return { text: "Desc", icon: <ChevronDownIcon className="h-3 w-3" /> };
  };

  const sortDisplay = getSortDisplay();
  const showButtons = headerRowHovered || isSorted;

  return (
    <th
      className={`px-4 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 select-none transition-colors ${className}`}
      style={{ textAlign: align, verticalAlign: 'top' }}
    >
      <div className={`flex flex-col gap-1.5 ${align === "center" ? "items-center" : align === "right" ? "items-end" : "items-start"}`}>
        {/* Column Label */}
        <span className="cursor-default">{label}</span>
        
        {/* Action buttons - visible on row hover */}
        <div className={`flex items-center gap-1 transition-opacity ${showButtons ? "opacity-100" : "opacity-0"}`}>
          {/* Sort Button */}
          <button
            onClick={() => tableState.toggleSort(sortKey)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
              isSorted 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-white hover:border-slate-600"
            }`}
            title="Toggle sort"
          >
            {sortDisplay.icon}
            <span>{sortDisplay.text}</span>
            {sortIndex > 0 && tableState.sortConfigs.length > 1 && (
              <span className="text-cyan-300 ml-0.5">{sortIndex}</span>
            )}
          </button>
          
          {/* Hide Button */}
          {canHide && (
            <button
              onClick={() => tableState.toggleColumnVisibility(columnKey)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-red-300 hover:border-red-500/30 transition-all cursor-pointer"
              title="Hide column"
            >
              <EyeOffIcon className="h-3 w-3" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>
    </th>
  );
}

// Course row component
function CourseRow({
  course,
  tableState,
  minVisible,
  maxVisible,
}: {
  course: Course;
  tableState: ReturnType<typeof useTableState>;
  minVisible: number;
  maxVisible: number;
}) {
  const timeDisplay = formatTimeDisplay(course.time);
  const isStarred = tableState.isStarred(course.id);
  const priority = tableState.getPriority(course.id);
  
  // Case-insensitive check for saved status
  const isSavedCourse = [...tableState.savedCourses].some(
    (saved) => saved.toLowerCase() === course.courseCode.toLowerCase()
  );
  const isSavedFaculty = [...tableState.savedFaculties].some(
    (saved) => saved.toLowerCase() === course.faculty.toLowerCase()
  );

  return (
    <tr className={`border-b border-slate-700/50 transition-all hover:bg-slate-800/50 group ${isStarred ? "bg-yellow-500/5" : ""}`}>
      {/* Index - leftmost, less prominent */}
      {tableState.isColumnVisible("index") && (
        <td className="px-4 py-2 text-slate-600 text-center font-mono text-xs">
          {course.index}
        </td>
      )}

      {/* Course Code */}
      {tableState.isColumnVisible("courseCode") && (
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-cyan-400">{course.courseCode}</span>
            <button
              onClick={() => tableState.toggleSavedCourse(course.courseCode)}
              className={`text-xs px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                isSavedCourse 
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                  : "bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {isSavedCourse ? "Saved" : "Save"}
            </button>
          </div>
        </td>
      )}

      {/* Section */}
      {tableState.isColumnVisible("section") && (
        <td className="px-4 py-2 text-center">
          <span className="text-white font-medium text-sm">
            {course.section}
          </span>
        </td>
      )}

      {/* Faculty */}
      {tableState.isColumnVisible("faculty") && (
        <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium text-emerald-400">{course.faculty}</span>
            <button
              onClick={() => tableState.toggleSavedFaculty(course.faculty)}
              className={`text-xs px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                isSavedFaculty 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
              }`}
            >
              {isSavedFaculty ? "Saved" : "Save"}
            </button>
          </div>
        </td>
      )}

      {/* Schedule */}
      {tableState.isColumnVisible("time") && (
        <td className="px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="w-8 text-sm">{timeDisplay.days}</span>
            <span className="text-sm text-slate-300">{timeDisplay.timing}</span>
          </div>
        </td>
      )}

      {/* Room */}
      {tableState.isColumnVisible("room") && (
        <td className="px-4 py-2 text-slate-300 text-center font-mono text-sm">
          {course.room}
        </td>
      )}

      {/* Priority */}
      {tableState.isColumnVisible("priority") && (
        <td className="px-3 py-2 text-center">
          <div className="flex justify-center">
            <PrioritySelector
              value={priority}
              onChange={(p) => tableState.setPriority(course.id, p)}
              minVisible={minVisible}
              maxVisible={maxVisible}
            />
          </div>
        </td>
      )}

      {/* Star - rightmost */}
      {tableState.isColumnVisible("star") && (
        <td className="px-3 py-2 text-center">
          <div className="flex justify-center">
            <button
              onClick={() => tableState.toggleStar(course.id)}
              className={`p-1 rounded transition-all hover:scale-110 cursor-pointer ${
                isStarred ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400/50"
              }`}
              title={isStarred ? "Remove star" : "Star this section"}
            >
              <StarIcon filled={isStarred} className="h-5 w-5" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// Filter pill component
function FilterPill({
  label,
  isActive,
  onToggle,
  onRemove,
  color = "cyan",
  className = "",
}: {
  label: string;
  isActive: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  color?: "cyan" | "emerald" | "amber" | "violet";
  className?: string;
}) {
  const colors = {
    cyan: {
      active: "bg-cyan-500/20 border-cyan-500/50 text-cyan-300",
      inactive: "bg-cyan-900/10 border-cyan-800/30 text-cyan-400/60 hover:bg-cyan-900/20 hover:text-cyan-400 hover:border-cyan-500/30",
    },
    emerald: {
      active: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
      inactive: "bg-emerald-900/10 border-emerald-800/30 text-emerald-400/60 hover:bg-emerald-900/20 hover:text-emerald-400 hover:border-emerald-500/30",
    },
    amber: {
      active: "bg-amber-500/20 border-amber-500/50 text-amber-300",
      inactive: "bg-slate-900/50 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30",
    },
    violet: {
      active: "bg-violet-500/20 border-violet-500/50 text-violet-300",
      inactive: "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-violet-500/30 hover:text-violet-400",
    },
  };

  return (
    <div className={`flex items-center h-8 ${className}`}>
      <button
        onClick={onToggle}
        className={`px-3 h-full flex items-center justify-center text-sm font-medium rounded-l-lg border transition-all cursor-pointer ${
          isActive ? colors[color].active : colors[color].inactive
        } ${!onRemove ? "rounded-r-lg" : ""}`}
      >
        {label}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className={`px-1.5 h-full flex items-center justify-center text-sm rounded-r-lg border border-l-0 transition-all cursor-pointer ${
             isActive 
               ? "bg-slate-800/30 border-slate-600/30 text-white/50 hover:text-red-400 hover:bg-slate-800/50" 
               : "bg-slate-800/30 border-slate-600/30 text-slate-500 hover:text-red-400 hover:bg-slate-800/50"
          } ${isActive ? colors[color].active.split(' ')[0] : colors[color].inactive.split(' ')[0]}`}
          title="Remove from saved"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Search bar with suggestions
function SearchBar({
  value,
  onChange,
  courses,
  tableState,
}: {
  value: string;
  onChange: (value: string) => void;
  courses: Course[];
  tableState: ReturnType<typeof useTableState>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get unique courses and faculties for suggestions (case-insensitive dedup)
  const allCourses = useMemo(() => {
    const seen = new Map<string, string>();
    courses.forEach((c) => {
      const lower = c.courseCode.toLowerCase();
      if (!seen.has(lower)) {
        seen.set(lower, c.courseCode);
      }
    });
    return [...seen.values()].sort();
  }, [courses]);

  const allFaculties = useMemo(() => {
    const seen = new Map<string, string>();
    courses.forEach((c) => {
      const lower = c.faculty.toLowerCase();
      if (!seen.has(lower)) {
        seen.set(lower, c.faculty);
      }
    });
    return [...seen.values()].sort();
  }, [courses]);

  // Filter suggestions based on current input
  const lastTerm = value.split(/\s+/).pop()?.toLowerCase() || "";
  const courseSuggestions = lastTerm
    ? allCourses.filter((c) => c.toLowerCase().includes(lastTerm)).slice(0, 5)
    : [];
  const facultySuggestions = lastTerm
    ? allFaculties.filter((f) => f.toLowerCase().includes(lastTerm)).slice(0, 5)
    : [];

  const hasSuggestions = courseSuggestions.length > 0 || facultySuggestions.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applySuggestion = (suggestion: string) => {
    const terms = value.split(/\s+/);
    terms.pop();
    terms.push(suggestion);
    onChange(terms.join(" ") + " ");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Check if saved (case-insensitive)
  const isCourseInSaved = (course: string) => 
    [...tableState.savedCourses].some((s) => s.toLowerCase() === course.toLowerCase());
  const isFacultyInSaved = (faculty: string) => 
    [...tableState.savedFaculties].some((s) => s.toLowerCase() === faculty.toLowerCase());

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        className={`relative flex items-center rounded-xl border bg-slate-800/50 transition-all ${
          isFocused
            ? "border-cyan-500/50 ring-2 ring-cyan-500/20"
            : "border-slate-600/50 hover:border-slate-500"
        }`}
      >
        <SearchIcon className="absolute left-4 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by anything. Combine multiple search types with space."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent py-3 pl-12 pr-10 text-white placeholder-slate-500 outline-none"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
          {courseSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                Courses
              </div>
              {courseSuggestions.map((course) => (
                <div
                  key={course}
                  onClick={() => applySuggestion(course)}
                  className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <span>{course}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      tableState.toggleSavedCourse(course);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                      isCourseInSaved(course)
                        ? "text-cyan-400 bg-cyan-500/10"
                        : "text-slate-500 hover:text-cyan-400 hover:bg-slate-600/50"
                    }`}
                    title="Save course for filtering"
                  >
                    <PlusIcon className="h-3 w-3" />
                    {isCourseInSaved(course) ? "Saved" : "Save Course"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {facultySuggestions.length > 0 && (
            <div className="p-2 border-t border-slate-700">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                Faculty
              </div>
              {facultySuggestions.map((faculty) => (
                <div
                  key={faculty}
                  onClick={() => applySuggestion(faculty)}
                  className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <span>{faculty}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      tableState.toggleSavedFaculty(faculty);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                      isFacultyInSaved(faculty)
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-500 hover:text-emerald-400 hover:bg-slate-600/50"
                    }`}
                    title="Save faculty for filtering"
                  >
                    <PlusIcon className="h-3 w-3" />
                    {isFacultyInSaved(faculty) ? "Saved" : "Save Faculty"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Filter bar component
function FilterBar({ tableState, totalCount, filteredCount, displayedCount }: { 
  tableState: ReturnType<typeof useTableState>; 
  totalCount: number; 
  filteredCount: number;
  displayedCount: number;
}) {
  const hasActiveFilters =
    tableState.activeCourseFilters.size > 0 ||
    tableState.activeFacultyFilters.size > 0 ||
    tableState.activeDayFilters.size > 0 ||
    tableState.showStarredOnly;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Saved Courses/Faculties + Starred */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter by Saved Courses/Faculties:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill
              label="⭐ Starred"
              isActive={tableState.showStarredOnly}
              onToggle={tableState.toggleStarredOnly}
              color="amber"
            />
            {[...tableState.savedCourses].map((course) => (
              <FilterPill
                key={course}
                label={course}
                isActive={[...tableState.activeCourseFilters].some(
                  (f) => f.toLowerCase() === course.toLowerCase()
                )}
                onToggle={() => tableState.toggleCourseFilter(course)}
                onRemove={() => tableState.removeSavedCourse(course)}
                color="cyan"
              />
            ))}
            {[...tableState.savedFaculties].map((faculty) => (
              <FilterPill
                key={faculty}
                label={faculty}
                isActive={[...tableState.activeFacultyFilters].some(
                  (f) => f.toLowerCase() === faculty.toLowerCase()
                )}
                onToggle={() => tableState.toggleFacultyFilter(faculty)}
                onRemove={() => tableState.removeSavedFaculty(faculty)}
                color="emerald"
              />
            ))}
          </div>
        </div>

        {/* Day Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter by Days:
          </span>
          <div className="flex flex-col gap-1.5">
            {/* Double-day pills - first row */}
            <div className="flex gap-2">
              {(["ST", "MW", "RA"] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => tableState.toggleDayFilter(day)}
                  className={`px-4.5 py-1.5 h-8 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                    tableState.activeDayFilters.has(day)
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-violet-500/30 hover:text-violet-400"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {/* Single-day pills - second row */}
            <div className="flex gap-1">
              {(["S", "M", "T", "W", "R", "A"] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => tableState.toggleDayFilter(day)}
                  className={`px-2 py-1.5 h-8 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                    tableState.activeDayFilters.has(day)
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:border-violet-500/30 hover:text-violet-400"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count + Clear + Updated text */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            Updated on <span className="text-slate-300">Jan 12, 2:43 AM</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {tableState.hiddenColumns.size > 0 && (
             <button
               onClick={tableState.resetColumnVisibility}
               className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
             >
               <EyeIcon className="h-4 w-4" />
               Show all columns
             </button>
          )}

          {tableState.sortConfigs.length > 0 && (
            <button
              onClick={tableState.clearSorts}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
              Clear sorts ({tableState.sortConfigs.length})
            </button>
          )}
          
          {(hasActiveFilters || tableState.searchQuery) && (
            <button
              onClick={tableState.clearAllFilters}
              className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-8">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-32 rounded bg-slate-700/50"></div>
          <div className="h-8 w-16 rounded bg-slate-700/50"></div>
          <div className="h-8 w-32 rounded bg-slate-700/50"></div>
          <div className="h-8 flex-1 rounded bg-slate-700/50"></div>
          <div className="h-8 w-24 rounded bg-slate-700/50"></div>
          <div className="h-8 w-8 rounded bg-slate-700/50"></div>
          <div className="h-8 w-8 rounded bg-slate-700/50"></div>
        </div>
      ))}
    </div>
  );
}

// Lazy loading constants
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;

export function CourseTable() {
  const { data, isLoading, error } = useCourses();
  const tableState = useTableState(data?.courses || []);
  
  // Lazy loading state
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const loaderRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Header row hover state for showing sort/hide buttons
  const [headerRowHovered, setHeaderRowHovered] = useState(false);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(INITIAL_LOAD);
  }, [tableState.searchQuery, tableState.activeCourseFilters, tableState.activeFacultyFilters, tableState.activeDayFilters, tableState.showStarredOnly]);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => {
            const newCount = prev + LOAD_MORE;
            return Math.min(newCount, tableState.filteredCourses.length);
          });
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [tableState.filteredCourses.length]);

  // Get displayed courses and visible priorities
  const displayedCourses = tableState.filteredCourses.slice(0, displayCount);
  const hasMore = displayCount < tableState.filteredCourses.length;
  
  const visiblePriorities = useMemo(() => {
    // Only consider visible rows for the relative coloring (or should it be all filtered rows?)
    // Request: "if the current value is lower than the other sections currently visible (based on active filters/search)"
    // This implies we should look at 'filteredCourses' (all matches) or 'displayedCourses' (in view). 
    // Usually 'currently visible' in a table context with lazy loading can mean either. 
    // Using filteredCourses makes the color stable as you scroll. Using displayedCourses changes color as you scroll.
    // Stable coloring is better UX.
    return tableState.filteredCourses.map(c => tableState.getPriority(c.id));
  }, [tableState.filteredCourses, tableState.getPriority]);

  const minPriority = visiblePriorities.length > 0 ? Math.min(...visiblePriorities) : 0;
  const maxPriority = visiblePriorities.length > 0 ? Math.max(...visiblePriorities) : 0;

  // Count visible columns for colspan
  const visibleColumnCount = (
    (tableState.isColumnVisible("courseCode") ? 1 : 0) +
    (tableState.isColumnVisible("section") ? 1 : 0) +
    (tableState.isColumnVisible("faculty") ? 1 : 0) +
    (tableState.isColumnVisible("time") ? 1 : 0) +
    (tableState.isColumnVisible("room") ? 1 : 0) +
    (tableState.isColumnVisible("index") ? 1 : 0) +
    (tableState.isColumnVisible("star") ? 1 : 0) +
    (tableState.isColumnVisible("priority") ? 1 : 0)
  ) || 1;

  // Check if at least one column is visible to enable hiding
  const canHide = visibleColumnCount > 1;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <div className="text-red-400 text-lg font-medium mb-2">Failed to load courses</div>
        <div className="text-red-300/70 text-sm">{error}</div>
      </div>
    );
  }

  if (!data || data.courses.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 text-center">
        <div className="text-slate-400 text-lg">No courses available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <SearchBar
        value={tableState.searchQuery}
        onChange={tableState.setSearchQuery}
        courses={data.courses}
        tableState={tableState}
      />

      {/* Filter Bar */}
      <FilterBar 
        tableState={tableState} 
        totalCount={data.courses.length}
        filteredCount={tableState.filteredCourses.length}
        displayedCount={displayedCourses.length}
      />

      {/* Table */}
      <div 
        ref={tableContainerRef}
        className="rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
             {/* No colgroup used here to let the browser auto-layout based on content, avoiding offsets */}
            <thead>
              <tr 
                className="border-b border-slate-700 bg-gradient-to-r from-slate-800/80 to-slate-800/40 group/header"
                onMouseEnter={() => setHeaderRowHovered(true)}
                onMouseLeave={() => setHeaderRowHovered(false)}
              >
                {/* Index - Leftmost */}
                {tableState.isColumnVisible("index") && (
                  <SortableHeader label="#" sortKey="index" columnKey="index" tableState={tableState} align="center" headerRowHovered={headerRowHovered} />
                )}

                {tableState.isColumnVisible("courseCode") && (
                  <SortableHeader label="Course" sortKey="courseCode" columnKey="courseCode" tableState={tableState} headerRowHovered={headerRowHovered} />
                )}
                {tableState.isColumnVisible("section") && (
                  <SortableHeader label="Section" sortKey="section" columnKey="section" tableState={tableState} align="center" headerRowHovered={headerRowHovered} />
                )}
                {tableState.isColumnVisible("faculty") && (
                  <SortableHeader label="Faculty" sortKey="faculty" columnKey="faculty" tableState={tableState} headerRowHovered={headerRowHovered} />
                )}
                {tableState.isColumnVisible("time") && (
                  <SortableHeader label="Schedule" sortKey="time" columnKey="time" tableState={tableState} align="left" headerRowHovered={headerRowHovered} />
                )}
                {tableState.isColumnVisible("room") && (
                  <SortableHeader label="Room" sortKey="room" columnKey="room" tableState={tableState} headerRowHovered={headerRowHovered} />
                )}
                
                {tableState.isColumnVisible("priority") && (
                  <SortableHeader label="Priority" sortKey="priority" columnKey="priority" tableState={tableState} align="center" headerRowHovered={headerRowHovered} />
                )}

                {/* Star - Rightmost */}
                {tableState.isColumnVisible("star") && (
                  <th className="px-3 pt-6 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400" style={{ verticalAlign: 'top' }}>
                    <div className="flex flex-col gap-1.5 items-center">
                      <span>STAR</span>
                      <div className={`flex items-center gap-1 transition-opacity ${headerRowHovered ? "opacity-100" : "opacity-0"}`}>
                        {canHide && (
                          <button
                            onClick={() => tableState.toggleColumnVisibility("star")}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-red-300 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Hide column"
                          >
                            <EyeOffIcon className="h-3 w-3" />
                            <span>Hide</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-12 text-center text-slate-400">
                    <div className="text-lg font-medium mb-2">No matching sections</div>
                    <div className="text-sm">Try adjusting your search or filters</div>
                  </td>
                </tr>
              ) : (
                displayedCourses.map((course) => (
                  <CourseRow 
                    key={course.id} 
                    course={course} 
                    tableState={tableState} 
                    minVisible={minPriority}
                    maxVisible={maxPriority}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Lazy loading indicator */}
        {hasMore && (
          <div ref={loaderRef} className="flex items-center justify-center py-4 text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"></div>
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
