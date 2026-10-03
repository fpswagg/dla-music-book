import { NextResponse } from "next/server";
import { getPublishedSongs } from "@/lib/data-provider";

export type OfflineSong = {
  index: number;
  title: string;
  page: number | null;
  references: Array<{ code: string; number: string }>;
  authors: string[];
  content: unknown;
};

/** Every published hymn with structured lyrics, saved by the browser for offline reading. */
export async function GET() {
  const songs = await getPublishedSongs();
  const body: { generatedAt: string; songs: OfflineSong[] } = {
    generatedAt: new Date().toISOString(),
    songs: songs.map((s) => ({
      index: s.index,
      title: s.title,
      page: s.page,
      references: s.references.map((r) => ({ code: r.code, number: r.number })),
      authors: s.authors.map((a) => a.name),
      content: s.versions[0]?.content ?? { version: 1, blocks: [], refrainAfterEachStanza: false },
    })),
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
