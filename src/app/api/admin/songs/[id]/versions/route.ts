import { NextRequest, NextResponse } from "next/server";
import { VersionType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";
import { contentJson, lyricsFromText, refreshSearchText } from "@/lib/song-writer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: songId } = await params;
  const { versionType, lyricsText, lyrics: legacyLyrics, versionNumber } = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Create version", { songId, versionType });
    return NextResponse.json({ id: "mock-version" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const max = await prisma.songVersion.aggregate({
    where: { songId },
    _max: { versionNumber: true },
  });
  const nextNum =
    typeof versionNumber === "number" && versionNumber > 0
      ? versionNumber
      : (max._max.versionNumber ?? 0) + 1;

  const vt =
    versionType === "DEMO" || versionType === "REWRITE" || versionType === "ORIGINAL"
      ? (versionType as VersionType)
      : "ORIGINAL";

  const v = await prisma.songVersion.create({
    data: {
      songId,
      versionType: vt,
      versionNumber: nextNum,
      ...(() => {
        const parsed = lyricsFromText(typeof lyricsText === "string" ? lyricsText : typeof legacyLyrics === "string" ? legacyLyrics : "");
        return { lyrics: parsed.lyrics, content: contentJson(parsed.content) };
      })(),
    },
  });
  await refreshSearchText(songId);

  return NextResponse.json(v);
}
