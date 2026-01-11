import { NextResponse } from "next/server";
import { parseCoursesFromHtml } from "@/app/lib/parser";
import { ApiResponse, CourseData } from "@/app/types/course";
import { promises as fs } from "fs";
import path from "path";

// Cache the parsed data in memory
let cachedData: CourseData | null = null;

async function loadStaticData(): Promise<CourseData> {
  if (cachedData) {
    return cachedData;
  }

  const dataPath = path.join(process.cwd(), "data", "response.html");
  const html = await fs.readFile(dataPath, "utf-8");
  const courseData = parseCoursesFromHtml(html);
  
  cachedData = courseData;
  return courseData;
}

export async function GET(): Promise<NextResponse<ApiResponse<CourseData>>> {
  try {
    const courseData = await loadStaticData();

    return NextResponse.json({
      success: true,
      data: courseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error loading course data:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load course data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
