import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, index, lyrics, status } = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Create song:", { title, index });
    return NextResponse.json({ id: "mock-new", title, index });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const song = await prisma.song.create({
    data: {
      title,
      index,
      status: status || "DRAFT",
      versions: {
        create: { lyrics: lyrics || "", versionType: "ORIGINAL", versionNumber: 1 },
      },
    },
  });

  return NextResponse.json(song);
}
