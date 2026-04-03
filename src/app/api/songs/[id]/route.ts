import { NextResponse } from "next/server";
import { getSongById } from "@/lib/data-provider";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(song);
}
