import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { getTune, linkSongs, unlinkSong, updateTune } from "@/lib/scores";
import { parseBody, tunePatch } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const tune = await getTune((await params).id, user);
  return tune ? NextResponse.json({ tune }) : jsonError("Not found", 404);
}

/** Edit a tune and the hymns sung to it. Admin only. */
export async function PATCH(request: Request, { params }: Ctx) {
  const user = await guard("admin");
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const parsed = await parseBody(request, tunePatch);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { linkSongIds, linkSongIndexes, unlinkSongIds, songIds: _ignored, ...data } = parsed.data;
  void _ignored;
  try {
    if (Object.keys(data).length) await updateTune(id, data);
    if (linkSongIds?.length) await linkSongs(id, linkSongIds);
    if (linkSongIndexes?.length) {
      const songs = await prisma!.song.findMany({ where: { index: { in: linkSongIndexes } }, select: { id: true } });
      await linkSongs(id, songs.map((s) => s.id));
    }
    for (const songId of unlinkSongIds ?? []) await unlinkSong(songId);
  } catch {
    return jsonError("Not found", 404);
  }
  return NextResponse.json({ tune: await getTune(id, user) });
}
