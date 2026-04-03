"use client";

import { useEffect } from "react";
import { trackPageView, trackSongView } from "@/lib/analytics/tracker";
import { usePathname } from "next/navigation";

export function usePageView() {
  const pathname = usePathname();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}

export function useSongView(songId: string, songTitle: string) {
  useEffect(() => {
    trackSongView(songId, songTitle);
  }, [songId, songTitle]);
}
