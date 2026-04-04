import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSongs } from "@/lib/data-provider";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const { songs } = await getSongs({
    q: q || undefined,
    status: "FINISHED",
    limit: 20,
  });

  return NextResponse.json({
    songs: songs.map((s) => ({
      id: s.id,
      title: s.title,
      index: s.index,
    })),
  });
}
