import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { title, status, lyrics } = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Update song:", { id, title, status });
    return NextResponse.json({ id, title, status });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const song = await prisma.song.update({
    where: { id },
    data: { title, status },
  });

  if (lyrics !== undefined) {
    const latestVersion = await prisma.songVersion.findFirst({
      where: { songId: id },
      orderBy: { versionNumber: "desc" },
    });
    if (latestVersion) {
      await prisma.songVersion.update({
        where: { id: latestVersion.id },
        data: { lyrics },
      });
    }
  }

  return NextResponse.json(song);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
