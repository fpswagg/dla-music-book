import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; annotationId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId, annotationId } = await params;
  const { lineNumber, lineText, note } = await request.json();

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const ann = await prisma.annotation.findFirst({
    where: { id: annotationId, songVersionId: versionId },
  });
  if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.annotation.update({
    where: { id: annotationId },
    data: {
      ...(typeof lineNumber === "number" && { lineNumber }),
      ...(typeof lineText === "string" && { lineText }),
      ...(typeof note === "string" && { note }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; annotationId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { versionId, annotationId } = await params;

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const ann = await prisma.annotation.findFirst({
    where: { id: annotationId, songVersionId: versionId },
  });
  if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.annotation.delete({ where: { id: annotationId } });
  return NextResponse.json({ ok: true });
}
