"use client";

import { useState, useEffect } from "react";
import { CourseData, ApiResponse } from "../types/course";

interface UseCourseDataReturn {
  /** The course data */
  data: CourseData | null;
  /** Whether data is initial loading */
  isLoading: boolean;
  /** Whether a background/manual refresh is happening */
  isRefreshing: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually refresh course data without full page reload */
  refresh: () => Promise<void>;
}

export function useCourseData(): UseCourseDataReturn {
  const [data, setData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/courses?_t=${Date.now()}`, { cache: "no-store" });
      const result: ApiResponse<CourseData> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to load course data");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  const refresh = async () => {
    await fetchData(true);
  };

  return { data, isLoading, isRefreshing, error, refresh };
}
