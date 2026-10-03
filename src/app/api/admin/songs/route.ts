import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";
import { parseBody, songInput } from "@/lib/validation";
import { contentJson, lyricsFromText, refreshSearchText, replaceReferences } from "@/lib/song-writer";
import { firstLine } from "@/lib/lyrics";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(request, songInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;

  if (isMockMode()) return NextResponse.json({ id: "mock-new", title: data.title, index: data.index });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  if (await prisma.song.findUnique({ where: { index: data.index }, select: { id: true } })) {
    return NextResponse.json({ error: "INDEX_TAKEN" }, { status: 409 });
  }

  const { content, lyrics } = lyricsFromText(data.lyricsText, data.refrainAfterEachStanza);
  const title = data.title || firstLine(content) || String(data.index);
  const song = await prisma.$transaction(async (tx) => {
    const created = await tx.song.create({
      data: {
        title,
        index: data.index,
        status: data.status,
        page: data.page ?? null,
        tune: data.tune || null,
        versions: { create: { lyrics, content: contentJson(content), versionType: "ORIGINAL", versionNumber: 1 } },
      },
    });
    if (data.authorIds?.length) {
      await tx.songAuthor.createMany({
        data: data.authorIds.map((authorId, i) => ({ songId: created.id, authorId, displayOrder: i + 1 })),
      });
    }
    if (data.tagIds?.length) await tx.songTag.createMany({ data: data.tagIds.map((tagId) => ({ songId: created.id, tagId })) });
    if (data.languageIds?.length) {
      await tx.songLanguage.createMany({ data: data.languageIds.map((languageId) => ({ songId: created.id, languageId })) });
    } else {
      const duala = await tx.language.findUnique({ where: { code: "duala" } });
      if (duala) await tx.songLanguage.create({ data: { songId: created.id, languageId: duala.id } });
    }
    if (data.references?.length) await replaceReferences(tx, created.id, data.references);
    await refreshSearchText(created.id, tx);
    return created;
  });

  return NextResponse.json(song, { status: 201 });
}
