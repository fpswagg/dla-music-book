import { NextRequest, NextResponse } from "next/server";
import { SongStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    status,
    lyrics,
    authorIds,
    tagIds,
    languageIds,
  } = body as {
    title?: string;
    status?: string;
    lyrics?: string;
    authorIds?: string[];
    tagIds?: string[];
    languageIds?: string[];
  };

  if (isMockMode()) {
    console.log("[Mock] Update song:", { id, title, status, authorIds, tagIds, languageIds });
    return NextResponse.json({ id, title, status });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  await prisma.$transaction(async (tx) => {
    await tx.song.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status: status as SongStatus }),
      },
    });

    if (lyrics !== undefined) {
      const latestVersion = await tx.songVersion.findFirst({
        where: { songId: id },
        orderBy: { versionNumber: "desc" },
      });
      if (latestVersion) {
        await tx.songVersion.update({
          where: { id: latestVersion.id },
          data: { lyrics },
        });
      }
    }

    if (Array.isArray(authorIds)) {
      await tx.songAuthor.deleteMany({ where: { songId: id } });
      let order = 1;
      for (const authorId of authorIds) {
        await tx.songAuthor.create({
          data: { songId: id, authorId, displayOrder: order++ },
        });
      }
    }

    if (Array.isArray(tagIds)) {
      await tx.songTag.deleteMany({ where: { songId: id } });
      for (const tagId of tagIds) {
        await tx.songTag.create({
          data: { songId: id, tagId },
        });
      }
    }

    if (Array.isArray(languageIds)) {
      await tx.songLanguage.deleteMany({ where: { songId: id } });
      for (const languageId of languageIds) {
        await tx.songLanguage.create({
          data: { songId: id, languageId },
        });
      }
    }
  });

  const song = await prisma.song.findUnique({ where: { id } });
  return NextResponse.json(song);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (isMockMode()) {
    console.log("[Mock] Delete song:", id);
    return NextResponse.json({ deleted: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  await prisma.song.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
