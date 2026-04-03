"use client";

let buffer: Array<{ eventType: string; metadata: Record<string, unknown> }> = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (buffer.length === 0) return;
  const events = [...buffer];
  buffer = [];

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  } catch {
    buffer.push(...events);
  }
}

export function trackEvent(eventType: string, metadata: Record<string, unknown> = {}) {
  buffer.push({ eventType, metadata });

  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 5000);
}

export function trackPageView(path: string) {
  trackEvent("page_view", { path, referrer: typeof document !== "undefined" ? document.referrer : "" });
}

export function trackSongView(songId: string, songTitle: string) {
  trackEvent("song_view", { songId, songTitle });
}

export function trackSearch(query: string, resultCount: number) {
  trackEvent("search", { query, resultCount });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (buffer.length > 0) {
      const data = JSON.stringify({ events: buffer });
      navigator.sendBeacon("/api/analytics", data);
      buffer = [];
    }
  });
}
