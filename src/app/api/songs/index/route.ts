import { NextResponse } from "next/server";
import { getSongSummaries } from "@/lib/data-provider";

/** Number → title list of published hymns (number pad preview, offline). */
export async function GET() {
  const songs = await getSongSummaries();
  return NextResponse.json(
    { songs: songs.map((s) => ({ index: s.index, title: s.title, firstLine: s.firstLine })) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } },
  );
}
