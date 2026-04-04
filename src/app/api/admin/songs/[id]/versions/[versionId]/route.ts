import { NextRequest, NextResponse } from "next/server";
import { VersionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, versionId } = await params;
  const body = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Update version", versionId);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const v = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { lyrics?: string; versionType?: VersionType } = {};
  if (typeof body.lyrics === "string") data.lyrics = body.lyrics;
  if (body.versionType === "DEMO" || body.versionType === "REWRITE" || body.versionType === "ORIGINAL") {
    data.versionType = body.versionType;
  }

  const updated = await prisma.songVersion.update({
    where: { id: versionId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, versionId } = await params;

  if (isMockMode()) {
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const v = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const count = await prisma.songVersion.count({ where: { songId } });
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete the only version" }, { status: 400 });
  }

  await prisma.songVersion.delete({ where: { id: versionId } });
  return NextResponse.json({ ok: true });
}
