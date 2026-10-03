import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { hymnalInput, parseBody } from "@/lib/validation";
import { refreshSearchText } from "@/lib/song-writer";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const { id } = await params;
  const parsed = await parseBody(request, hymnalInput.partial());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const before = await prisma.hymnal.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hymnal = await prisma.hymnal.update({ where: { id }, data: parsed.data });
  if (parsed.data.code && parsed.data.code !== before.code) {
    // The abbreviation is part of the search text of every hymn that cites it.
    const refs = await prisma.songReference.findMany({ where: { hymnalId: id }, select: { songId: true } });
    for (const r of refs) await refreshSearchText(r.songId);
  }
  return NextResponse.json(hymnal);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const { id } = await params;
  const used = await prisma.songReference.count({ where: { hymnalId: id } });
  if (used > 0) return NextResponse.json({ error: "IN_USE", count: used }, { status: 409 });
  await prisma.hymnal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
