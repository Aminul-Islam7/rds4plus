"use client";

import { useEffect, useState, useRef } from "react";
import { useCourses } from "../context/CourseContext";

const THIRTY_MINUTES_MS = 30 * 60 * 1000; // 30 minutes idle before checking for updates
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60s once threshold is reached

declare global {
  interface Window {
    __testUpdateNotice?: () => void;
  }
}

export function UpdateNotification() {
  // Sync paused for end of semester — notification polling disabled
  return null;
}
