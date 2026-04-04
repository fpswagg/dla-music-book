import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, versionId } = await params;
  const { fileUrl, durationSeconds } = await request.json();

  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    return NextResponse.json({ error: "fileUrl required" }, { status: 400 });
  }

  if (isMockMode()) {
    return NextResponse.json({ id: "mock-preview" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const v = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sec =
    typeof durationSeconds === "number" && durationSeconds >= 0
      ? Math.floor(durationSeconds)
      : 0;

  const p = await prisma.preview.create({
    data: {
      songVersionId: versionId,
      fileUrl: fileUrl.trim(),
      durationSeconds: sec,
    },
  });

  return NextResponse.json(p);
}
