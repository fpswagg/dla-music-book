import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, noteId } = await params;
  const { content } = await request.json();

  if (typeof content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const n = await prisma.songNote.findFirst({
    where: { id: noteId, songId },
  });
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.songNote.update({
    where: { id: noteId },
    data: { content },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, noteId } = await params;

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const n = await prisma.songNote.findFirst({
    where: { id: noteId, songId },
  });
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.songNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
