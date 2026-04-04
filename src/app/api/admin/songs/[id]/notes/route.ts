import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId } = await params;
  const { content } = await request.json();

  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  if (isMockMode()) {
    return NextResponse.json({ id: "mock-note" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const note = await prisma.songNote.create({
    data: {
      songId,
      content: content.trim(),
      createdById: admin.id,
    },
  });

  return NextResponse.json(note);
}
