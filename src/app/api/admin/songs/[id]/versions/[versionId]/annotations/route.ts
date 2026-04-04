import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId, versionId } = await params;
  const { lineNumber, lineText, note } = await request.json();

  if (
    typeof lineNumber !== "number" ||
    typeof lineText !== "string" ||
    typeof note !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (isMockMode()) {
    return NextResponse.json({ id: "mock-ann" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const v = await prisma.songVersion.findFirst({
    where: { id: versionId, songId },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ann = await prisma.annotation.create({
    data: {
      songVersionId: versionId,
      lineNumber,
      lineText,
      note,
      createdById: admin.id,
    },
  });

  return NextResponse.json(ann);
}
