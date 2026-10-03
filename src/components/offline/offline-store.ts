"use client";

import type { LyricsContent } from "@/lib/lyrics";

/** Shared with public/sw.js: the data cache name and the bundle URL. */
export const DATA_CACHE = "mmb-data";
export const BUNDLE_URL = "/api/offline/bundle";

export type OfflineBundle = {
  generatedAt: string;
  songs: Array<{
    index: number;
    title: string;
    page: number | null;
    references: Array<{ code: string; number: string }>;
    authors: string[];
    content: LyricsContent;
  }>;
};

export const offlineSupported = () => typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

/** Downloads every published hymn and stores it in the Cache API. */
export async function saveOfflineBundle(): Promise<OfflineBundle> {
  const res = await fetch(BUNDLE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cache = await caches.open(DATA_CACHE);
  await cache.put(BUNDLE_URL, res.clone());
  // Make sure the offline reader page itself is cached too.
  await fetch("/offline").catch(() => undefined);
  return (await res.json()) as OfflineBundle;
}

export async function readOfflineBundle(): Promise<OfflineBundle | null> {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  const cache = await caches.open(DATA_CACHE);
  const hit = await cache.match(BUNDLE_URL);
  return hit ? ((await hit.json()) as OfflineBundle) : null;
}

export async function removeOfflineBundle(): Promise<void> {
  const cache = await caches.open(DATA_CACHE);
  await cache.delete(BUNDLE_URL);
}
