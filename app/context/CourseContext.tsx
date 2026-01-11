"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useCourseData } from "../hooks/useCourseData";
import { CourseData } from "../types/course";

interface CourseContextValue {
  /** The course data */
  data: CourseData | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

const CourseContext = createContext<CourseContextValue | null>(null);

interface CourseProviderProps {
  children: ReactNode;
}

export function CourseProvider({ children }: CourseProviderProps) {
  const courseData = useCourseData();

  return (
    <CourseContext.Provider value={courseData}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses(): CourseContextValue {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses must be used within a CourseProvider");
  }
  return context;
}
