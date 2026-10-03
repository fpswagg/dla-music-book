"use client";

import { usePageView } from "@/hooks/use-analytics";

/** Records page views for the admin analytics. */
export function PageViewTracker() {
  usePageView();
  return null;
}
