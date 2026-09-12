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

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SortDualIcon({ direction, className }: { direction: "asc" | "desc" | null; className?: string }) {
  return (
    <svg className={className || "h-3.5 w-3.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 9l4-4 4 4"
        className={direction === "asc" ? "stroke-cyan-400 stroke-[2.5]" : "stroke-slate-500 opacity-60"}
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 15l-4 4-4-4"
        className={direction === "desc" ? "stroke-cyan-400 stroke-[2.5]" : "stroke-slate-500 opacity-60"}
      />
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
    if (maxVisible === minVisible) return "text-slate-400 bg-slate-800/80";
    
    // Normalize value between 0 and 1 relative to visible range
    const normalized = (value - minVisible) / (maxVisible - minVisible);
    
    // Bucket into 5 distinct color levels
    if (normalized < 0.2) return "text-red-400 bg-red-500/20";
    if (normalized < 0.4) return "text-orange-400 bg-orange-500/20";
    if (normalized < 0.6) return "text-yellow-400 bg-yellow-500/20";
    if (normalized < 0.8) return "text-teal-400 bg-teal-500/20";
    return "text-cyan-400 bg-cyan-500/20";
  };

  const colorClass = value === 0 ? "text-slate-400 bg-slate-800/80" : getColorClass();

  const handleDecrement = () => {
    if (value > -9) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < 99) onChange(value + 1);
  };

  return (
    <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${colorClass} transition-colors h-7`}>
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

// Columns dropdown menu component
const AVAILABLE_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "courseCode", label: "Course" },
  { key: "faculty", label: "Faculty" },
  { key: "room", label: "Seats" },
  { key: "section", label: "Section" },
  { key: "time", label: "Schedule" },
  { key: "priority", label: "Priority" },
  { key: "star", label: "Star" },
  { key: "index", label: "# (Number)" },
];

function ColumnsDropdown({ tableState }: { tableState: ReturnType<typeof useTableState> }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const visibleCount = AVAILABLE_COLUMNS.filter((col) => tableState.isColumnVisible(col.key)).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none ${
          isOpen
            ? "bg-slate-700 text-white shadow-lg"
            : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
        }`}
        title="Select visible columns"
      >
        <FilterIcon className="h-3.5 w-3.5 text-slate-300 shrink-0" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-md shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
            Visible Columns
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {AVAILABLE_COLUMNS.map((col) => {
              const isVisible = tableState.isColumnVisible(col.key);
              // prevent disabling if it's the only visible column
              const isLastVisible = isVisible && visibleCount <= 1;

              return (
                <button
                  key={col.key}
                  disabled={isLastVisible}
                  onClick={() => tableState.toggleColumnVisibility(col.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer select-none text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    isVisible
                      ? "bg-slate-800 text-slate-100 hover:bg-slate-750"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <span>{col.label}</span>
                  {isVisible ? (
                    <EyeIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                  ) : (
                    <EyeOffIcon className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sortable column header with compact sort button beside label
function SortableHeader({
  label,
  sortKey,
  tableState,
  className,
  align = "center",
}: {
  label: string;
  sortKey: keyof Course | "priority";
  columnKey?: ColumnKey;
  tableState: ReturnType<typeof useTableState>;
  className?: string;
  align?: "left" | "center" | "right";
  headerRowHovered?: boolean;
}) {
  const sortIndex = tableState.getSortIndex(sortKey);
  const sortDirection = tableState.getSortDirection(sortKey);
  const isSorted = sortIndex > 0;

  return (
    <th
      className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider select-none transition-colors ${className}`}
      style={{ textAlign: align }}
    >
      <button
        onClick={() => tableState.toggleSort(sortKey)}
        className={`group inline-flex items-center gap-1.5 cursor-pointer rounded px-1 py-0.5 transition-colors ${
          isSorted ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
        }`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <div className="flex items-center gap-0.5">
          <SortDualIcon direction={sortDirection} />
          {sortIndex > 0 && tableState.sortConfigs.length > 1 && (
            <span className="text-[10px] text-cyan-300 font-bold ml-0.5">{sortIndex}</span>
          )}
        </div>
      </button>
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
    <tr className={`transition-all hover:bg-slate-800/60 group ${isStarred ? "bg-yellow-500/5" : ""}`}>
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
              className={`text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                isSavedCourse 
                  ? "bg-cyan-500/20 text-cyan-300" 
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
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
              className={`text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                isSavedFaculty 
                  ? "bg-emerald-500/20 text-emerald-300" 
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
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
      active: "bg-cyan-500/25 text-cyan-300",
      inactive: "bg-slate-800 text-cyan-400/80 hover:bg-slate-700 hover:text-cyan-300",
    },
    emerald: {
      active: "bg-emerald-500/25 text-emerald-300",
      inactive: "bg-slate-800 text-emerald-400/80 hover:bg-slate-700 hover:text-emerald-300",
    },
    amber: {
      active: "bg-amber-500/25 text-amber-300",
      inactive: "bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700",
    },
    violet: {
      active: "bg-violet-500/25 text-violet-300",
      inactive: "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-violet-300",
    },
  };

  return (
    <div className={`flex items-center h-8 ${className}`}>
      <button
        onClick={onToggle}
        className={`px-3 h-full flex items-center justify-center text-sm font-medium rounded-l-lg transition-all cursor-pointer ${
          isActive ? colors[color].active : colors[color].inactive
        } ${!onRemove ? "rounded-r-lg" : ""}`}
      >
        {label}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className={`px-1.5 h-full flex items-center justify-center text-sm rounded-r-lg transition-all cursor-pointer ${
             isActive 
               ? "bg-slate-800/80 text-white/50 hover:text-red-400 hover:bg-slate-700" 
               : "bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-slate-700"
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
        className={`relative flex items-center rounded-xl bg-slate-800/70 transition-all ${
          isFocused
            ? "bg-slate-800 ring-2 ring-cyan-500/30"
            : "hover:bg-slate-800/90"
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
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
          {courseSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Courses
              </div>
              {courseSuggestions.map((course) => (
                <div
                  key={course}
                  onClick={() => applySuggestion(course)}
                  className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-slate-700/60 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <span>{course}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      tableState.toggleSavedCourse(course);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                      isCourseInSaved(course)
                        ? "text-cyan-400 bg-cyan-500/20"
                        : "text-slate-400 hover:text-cyan-300 hover:bg-slate-600/50"
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
            <div className="p-2 bg-slate-850">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Faculty
              </div>
              {facultySuggestions.map((faculty) => (
                <div
                  key={faculty}
                  onClick={() => applySuggestion(faculty)}
                  className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700/60 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <span>{faculty}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      tableState.toggleSavedFaculty(faculty);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                      isFacultyInSaved(faculty)
                        ? "text-emerald-400 bg-emerald-500/20"
                        : "text-slate-400 hover:text-emerald-300 hover:bg-slate-600/50"
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
function FilterBar({ tableState, totalCount, filteredCount, displayedCount, lastUpdated }: { 
  tableState: ReturnType<typeof useTableState>; 
  totalCount: number; 
  filteredCount: number;
  displayedCount: number;
  lastUpdated?: string;
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
                  className={`px-4.5 py-1.5 h-8 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    tableState.activeDayFilters.has(day)
                      ? "bg-violet-500/25 text-violet-300"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-violet-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {/* Single-day pills - second row */}
            <div className="flex gap-1.5">
              {(["S", "M", "T", "W", "R", "A"] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => tableState.toggleDayFilter(day)}
                  className={`px-2 py-1.5 h-8 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    tableState.activeDayFilters.has(day)
                      ? "bg-violet-500/25 text-violet-300"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-violet-300"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-4 min-h-[20px]">
          {lastUpdated ? (
            <div className="text-sm text-slate-400 flex flex-wrap items-center gap-1.5">
              <span>Last updated:</span>
              <span className="text-slate-300 font-medium">{lastUpdated}</span>
              <span className="text-slate-500">·</span>
              <span>
                (Data source:{" "}
                <a
                  href="https://rds2-bff.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 underline decoration-slate-600 hover:decoration-slate-400 underline-offset-2 transition-colors cursor-pointer"
                >
                  RDS2 BUT FROM FUTURE
                </a>
                )
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-4 w-60 rounded bg-slate-800/80" />
            </div>
          )}
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          {tableState.sortConfigs.length > 0 && (
            <button
              onClick={tableState.clearSorts}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <XIcon className="h-4 w-4 shrink-0" />
              <span>Clear sorts ({tableState.sortConfigs.length})</span>
            </button>
          )}
          
          {(hasActiveFilters || tableState.searchQuery) && (
            <button
              onClick={tableState.clearAllFilters}
              className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <XIcon className="h-4 w-4 shrink-0" />
              <span>Clear all filters</span>
            </button>
          )}

          <ColumnsDropdown tableState={tableState} />
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <SearchBar
        value={tableState.searchQuery}
        onChange={tableState.setSearchQuery}
        courses={data?.courses || []}
        tableState={tableState}
      />

      {/* Warning: search + active filters combined */}
      {tableState.searchQuery.trim() &&
        (tableState.activeCourseFilters.size > 0 ||
          tableState.activeFacultyFilters.size > 0 ||
          tableState.activeDayFilters.size > 0 ||
          tableState.showStarredOnly) && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
            <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>
              Active filters are narrowing your search results.{" "}
              <button
                onClick={tableState.clearAllFilters}
                className="font-semibold text-amber-200 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
              >
                Clear filters
              </button>{" "}
              to search across all sections.
            </span>
          </div>
        )}

      {/* Filter Bar */}
      <FilterBar 
        tableState={tableState} 
        totalCount={data?.courses.length || 0}
        filteredCount={tableState.filteredCourses.length}
        displayedCount={displayedCourses.length}
        lastUpdated={data?.meta.lastUpdated}
      />

      {/* Table */}
      <div 
        ref={tableContainerRef}
        className="rounded-xl bg-slate-900/60 backdrop-blur-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
             {/* No colgroup used here to let the browser auto-layout based on content, avoiding offsets */}
            <thead>
              <tr className="bg-slate-800/80">
                {/* Index - Leftmost */}
                {tableState.isColumnVisible("index") && (
                  <SortableHeader label="#" sortKey="index" tableState={tableState} align="center" />
                )}

                {tableState.isColumnVisible("courseCode") && (
                  <SortableHeader label="Course" sortKey="courseCode" tableState={tableState} />
                )}
                {tableState.isColumnVisible("section") && (
                  <SortableHeader label="Section" sortKey="section" tableState={tableState} align="center" />
                )}
                {tableState.isColumnVisible("faculty") && (
                  <SortableHeader label="Faculty" sortKey="faculty" tableState={tableState} />
                )}
                {tableState.isColumnVisible("time") && (
                  <SortableHeader label="Schedule" sortKey="time" tableState={tableState} align="left" />
                )}
                {tableState.isColumnVisible("room") && (
                  <SortableHeader label="Seats" sortKey="room" tableState={tableState} />
                )}
                
                {tableState.isColumnVisible("priority") && (
                  <SortableHeader label="Priority" sortKey="priority" tableState={tableState} align="center" />
                )}

                {/* Star - Rightmost */}
                {tableState.isColumnVisible("star") && (
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
                    <span>Star</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(12)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-800/30">
                    {tableState.isColumnVisible("index") && (
                      <td className="px-4 py-3 text-center">
                        <div className="h-4 w-6 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("courseCode") && (
                      <td className="px-4 py-3 text-center">
                        <div className="h-5 w-20 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("section") && (
                      <td className="px-3 py-3 text-center">
                        <div className="h-4 w-8 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("faculty") && (
                      <td className="px-4 py-3 text-center">
                        <div className="h-5 w-16 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("time") && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-8 rounded bg-slate-800/60" />
                          <div className="h-4 w-32 rounded bg-slate-800/60" />
                        </div>
                      </td>
                    )}
                    {tableState.isColumnVisible("room") && (
                      <td className="px-3 py-3 text-center">
                        <div className="h-4 w-14 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("priority") && (
                      <td className="px-3 py-3 text-center">
                        <div className="h-6 w-16 mx-auto rounded-lg bg-slate-800/60" />
                      </td>
                    )}
                    {tableState.isColumnVisible("star") && (
                      <td className="px-3 py-3 text-center">
                        <div className="h-5 w-5 mx-auto rounded bg-slate-800/60" />
                      </td>
                    )}
                  </tr>
                ))
              ) : error && !data ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-12 text-center text-red-400">
                    <div className="text-lg font-medium mb-2">Failed to load courses</div>
                    <div className="text-sm text-red-300/70">{error}</div>
                  </td>
                </tr>
              ) : !data || data.courses.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-12 text-center text-slate-400">
                    <div className="text-lg font-medium mb-2">No courses available</div>
                  </td>
                </tr>
              ) : displayedCourses.length === 0 ? (
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
        {!isLoading && hasMore && (
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
