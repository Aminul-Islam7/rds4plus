"use client";

import { useCourses } from "../context/CourseContext";
import { Course } from "../types/course";
import { formatTimeDisplay } from "../lib/parser";

function CourseRow({ course }: { course: Course }) {
  const timeDisplay = formatTimeDisplay(course.time);
  
  return (
    <tr className="border-b border-slate-700/50 transition-all hover:bg-slate-800/50">
      <td className="px-4 py-3 text-slate-400 text-center font-mono text-sm">
        {course.index}
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold text-cyan-400">{course.courseCode}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/50 text-white font-medium text-sm">
          {course.section}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-cyan-400">
        {course.faculty}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 text-sm font-medium font-semibold">{timeDisplay.days}</span>
          <span className="text-sm text-slate-300">{timeDisplay.timing}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-300 font-mono text-sm">
        {course.room}
      </td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-8">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4">
          <div className="h-8 w-16 rounded bg-slate-700/50"></div>
          <div className="h-8 w-32 rounded bg-slate-700/50"></div>
          <div className="h-8 w-20 rounded bg-slate-700/50"></div>
          <div className="h-8 w-48 rounded bg-slate-700/50"></div>
          <div className="h-8 flex-1 rounded bg-slate-700/50"></div>
          <div className="h-8 w-32 rounded bg-slate-700/50"></div>
        </div>
      ))}
    </div>
  );
}

export function CourseTable() {
  const { data, isLoading, error } = useCourses();

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
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-[800px]">
          <colgroup>
            <col className="w-16" />
            <col className="w-32" />
            <col className="w-20" />
            <col className="w-48" />
            <col className="w-auto" />
            <col className="w-32" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-700 bg-gradient-to-r from-slate-800/80 to-slate-800/40">
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">#</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Course</th>
              <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Sec</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Faculty</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Schedule</th>
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Room</th>
            </tr>
          </thead>
          <tbody>
            {data.courses.map((course) => (
              <CourseRow key={course.id} course={course} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
