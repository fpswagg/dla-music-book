import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { getSungLines } from "@/lib/recordings";

/** Sung lines of a hymn (singing order), for the alignment editor when the hymn changes. */
export async function GET(request: Request) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const songId = new URL(request.url).searchParams.get("songId") ?? "";
  return NextResponse.json({ lines: songId ? await getSungLines(songId) : [] });
}
