import { NextResponse } from "next/server";
import { getSongByParam } from "@/lib/data-provider";
import { getCurrentUser } from "@/lib/auth-helpers";

/** One hymn by number ("/api/songs/42") or id. Drafts only for admins. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getSongByParam(id);
  if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (song.status !== "FINISHED" && (await getCurrentUser())?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(song);
}
