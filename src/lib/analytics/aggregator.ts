import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function getViewsOverTime(days: number = 7) {
  if (isMockMode() || !prisma) {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split("T")[0],
      views: Math.floor(Math.random() * 50 + 10),
    }));
  }

  const since = new Date(Date.now() - days * 86400000);
  const events = await prisma.analyticsEvent.findMany({
    where: { eventType: "page_view", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const map = new Map<string, number>();
  events.forEach((e) => {
    const key = e.createdAt.toISOString().split("T")[0];
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split("T")[0];
    return { date, views: map.get(date) || 0 };
  });
}

export async function getTopSongs(limit: number = 10) {
  if (isMockMode() || !prisma) {
    return [
      { songId: "song-1", songTitle: "Nya Loba", views: 42 },
      { songId: "song-3", songTitle: "Hosana", views: 35 },
      { songId: "song-10", songTitle: "Alléluia Douala", views: 28 },
    ];
  }

  const events = await prisma.analyticsEvent.findMany({
    where: { eventType: "song_view" },
    select: { metadata: true },
  });

  const counts = new Map<string, { songId: string; songTitle: string; views: number }>();
  for (const e of events) {
    const meta = e.metadata as Record<string, string>;
    const songId = meta.songId || "";
    const songTitle = meta.songTitle || "";
    const key = `${songId}\0${songTitle}`;
    const prev = counts.get(key);
    if (prev) prev.views += 1;
    else counts.set(key, { songId, songTitle, views: 1 });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function getTopSearches(limit: number = 10) {
  if (isMockMode() || !prisma) {
    return [
      { query: "hosana", count: 15 },
      { query: "loba", count: 12 },
      { query: "nya loba", count: 8 },
    ];
  }

  const events = await prisma.analyticsEvent.findMany({
    where: { eventType: "search" },
    select: { metadata: true },
  });

  const counts = new Map<string, number>();
  for (const e of events) {
    const meta = e.metadata as Record<string, string>;
    const query = meta.query || "";
    counts.set(query, (counts.get(query) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getTotalAnalytics() {
  if (isMockMode() || !prisma) {
    return { totalViews: 234, uniqueSearches: 45, songViews: 189, avgDailyViews: 33 };
  }

  const [totalViews, songViews, searches] = await Promise.all([
    prisma.analyticsEvent.count({ where: { eventType: "page_view" } }),
    prisma.analyticsEvent.count({ where: { eventType: "song_view" } }),
    prisma.analyticsEvent.count({ where: { eventType: "search" } }),
  ]);

  return { totalViews, uniqueSearches: searches, songViews, avgDailyViews: Math.round(totalViews / 7) };
}
