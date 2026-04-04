import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; previewId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, versionId, previewId } = await params;

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const v = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const p = await prisma.preview.findFirst({
    where: { id: previewId, songVersionId: versionId },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.preview.delete({ where: { id: previewId } });
  return NextResponse.json({ ok: true });
}
