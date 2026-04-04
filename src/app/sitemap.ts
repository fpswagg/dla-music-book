import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockCollections, getMockSongs } from "@/lib/mock/provider";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/songs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/auth/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const songEntries: MetadataRoute.Sitemap = [];
  const collectionEntries: MetadataRoute.Sitemap = [];

  if (isMockMode()) {
    for (const s of getMockSongs({ status: "FINISHED" })) {
      songEntries.push({
        url: `${base}/songs/${s.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const c of getMockCollections(true)) {
      collectionEntries.push({
        url: `${base}/collections/${c.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } else if (prisma) {
    const [songs, cols] = await Promise.all([
      prisma.song.findMany({
        where: { status: "FINISHED" },
        select: { id: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { status: "PUBLIC" },
        select: { id: true, createdAt: true },
      }),
    ]);
    for (const s of songs) {
      songEntries.push({
        url: `${base}/songs/${s.id}`,
        lastModified: s.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    for (const c of cols) {
      collectionEntries.push({
        url: `${base}/collections/${c.id}`,
        lastModified: c.createdAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...songEntries, ...collectionEntries];
}
