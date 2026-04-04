import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import {
  addSongToMockUserCollection,
  removeSongFromMockUserCollection,
} from "@/lib/mock/provider";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: collectionId } = await params;
  const { songId } = await request.json();
  if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });

  if (isMockMode()) {
    addSongToMockUserCollection(collectionId, songId, user.id);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maxOrder = await prisma.collectionSong.aggregate({
    where: { collectionId },
    _max: { displayOrder: true },
  });
  const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  await prisma.collectionSong.create({
    data: {
      collectionId,
      songId,
      displayOrder: nextOrder,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: collectionId } = await params;
  const songId = request.nextUrl.searchParams.get("songId");
  if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });

  if (isMockMode()) {
    removeSongFromMockUserCollection(collectionId, songId, user.id);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collectionSong.delete({
    where: {
      collectionId_songId: { collectionId, songId },
    },
  });

  return NextResponse.json({ ok: true });
}
