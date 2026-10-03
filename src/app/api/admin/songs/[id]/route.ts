import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";
import { parseBody, songUpdateInput } from "@/lib/validation";
import { contentJson, lyricsFromText, refreshSearchText, replaceReferences } from "@/lib/song-writer";
import { firstLine } from "@/lib/lyrics";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(request, songUpdateInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;

  if (isMockMode()) return NextResponse.json({ id, title: data.title, status: data.status });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  if (data.index !== undefined) {
    const other = await prisma.song.findUnique({ where: { index: data.index }, select: { id: true } });
    if (other && other.id !== id) return NextResponse.json({ error: "INDEX_TAKEN" }, { status: 409 });
  }

  const parsedLyrics = data.lyricsText !== undefined ? lyricsFromText(data.lyricsText, data.refrainAfterEachStanza) : null;
  const title = data.title === "" && parsedLyrics ? firstLine(parsedLyrics.content) || undefined : data.title || undefined;

  await prisma.$transaction(async (tx) => {
    await tx.song.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(data.index !== undefined && { index: data.index }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.page !== undefined && { page: data.page }),
        ...(data.tune !== undefined && { tune: data.tune || null }),
      },
    });

    if (parsedLyrics) {
      const latest = await tx.songVersion.findFirst({ where: { songId: id }, orderBy: { versionNumber: "desc" } });
      const { content, lyrics } = parsedLyrics;
      if (latest) {
        await tx.songVersion.update({ where: { id: latest.id }, data: { lyrics, content: contentJson(content) } });
      } else {
        await tx.songVersion.create({ data: { songId: id, versionNumber: 1, lyrics, content: contentJson(content) } });
      }
    }

    if (data.authorIds) {
      await tx.songAuthor.deleteMany({ where: { songId: id } });
      await tx.songAuthor.createMany({
        data: data.authorIds.map((authorId, i) => ({ songId: id, authorId, displayOrder: i + 1 })),
      });
    }
    if (data.tagIds) {
      await tx.songTag.deleteMany({ where: { songId: id } });
      await tx.songTag.createMany({ data: data.tagIds.map((tagId) => ({ songId: id, tagId })) });
    }
    if (data.languageIds) {
      await tx.songLanguage.deleteMany({ where: { songId: id } });
      await tx.songLanguage.createMany({ data: data.languageIds.map((languageId) => ({ songId: id, languageId })) });
    }
    if (data.references) await replaceReferences(tx, id, data.references);
    await refreshSearchText(id, tx);
  });

  const song = await prisma.song.findUnique({ where: { id } });
  return NextResponse.json(song);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (isMockMode()) return NextResponse.json({ deleted: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  await prisma.song.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
