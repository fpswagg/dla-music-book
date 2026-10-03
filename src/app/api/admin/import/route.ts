import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";
import { importInput, parseBody } from "@/lib/validation";
import { contentJson, lyricsFromText, refreshSearchText, replaceReferences } from "@/lib/song-writer";

/** Save hymns parsed by the bulk import tool (src/lib/book-import.ts). */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseBody(request, importInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { hymns, onExisting, status, languageCode } = parsed.data;

  if (isMockMode()) return NextResponse.json({ created: hymns.length, updated: 0, skipped: 0 });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const language = await prisma.language.findUnique({ where: { code: languageCode } });
  const result = { created: 0, updated: 0, skipped: 0 };

  for (const h of hymns) {
    const { content, lyrics } = lyricsFromText(h.lyricsText);
    const existing = await prisma.song.findUnique({
      where: { index: h.index },
      select: { id: true, versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { id: true } } },
    });
    if (existing && onExisting === "skip") {
      result.skipped++;
      continue;
    }
    await prisma.$transaction(async (tx) => {
      let songId: string;
      if (existing) {
        songId = existing.id;
        await tx.song.update({ where: { id: songId }, data: { title: h.title, page: h.page ?? null } });
        if (existing.versions[0]) {
          await tx.songVersion.update({ where: { id: existing.versions[0].id }, data: { lyrics, content: contentJson(content) } });
        } else {
          await tx.songVersion.create({ data: { songId, versionNumber: 1, lyrics, content: contentJson(content) } });
        }
        result.updated++;
      } else {
        const song = await tx.song.create({
          data: {
            index: h.index,
            title: h.title,
            status,
            page: h.page ?? null,
            versions: { create: { versionNumber: 1, versionType: "ORIGINAL", lyrics, content: contentJson(content) } },
            ...(language && { songLanguages: { create: { languageId: language.id } } }),
          },
        });
        songId = song.id;
        result.created++;
      }
      if (h.references.length) await replaceReferences(tx, songId, h.references);
      await refreshSearchText(songId, tx);
    }, { timeout: 20_000 });
  }

  return NextResponse.json(result);
}
