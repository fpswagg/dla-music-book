import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({});

  const songIds = request.nextUrl.searchParams.get("songIds")?.split(",").filter(Boolean) ?? [];
  if (songIds.length === 0) return NextResponse.json({});

  if (isMockMode()) return NextResponse.json({});
  if (!prisma) return NextResponse.json({});

  const likes = await prisma.like.findMany({
    where: { userId: user.id, songId: { in: songIds } },
    select: { songId: true },
  });

  const result: Record<string, boolean> = {};
  for (const id of songIds) result[id] = likes.some((l) => l.songId === id);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { songId } = await request.json();
  if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });

  if (isMockMode()) {
    console.log("[Mock] Like toggled for song:", songId);
    return NextResponse.json({ liked: true, likeCount: 1 });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const existing = await prisma.like.findUnique({
    where: { userId_songId: { userId: user.id, songId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const likeCount = await prisma.like.count({ where: { songId } });
    return NextResponse.json({ liked: false, likeCount });
  }

  await prisma.like.create({ data: { userId: user.id, songId } });
  const likeCount = await prisma.like.count({ where: { songId } });
  return NextResponse.json({ liked: true, likeCount });
}
