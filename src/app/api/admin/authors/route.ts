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

  const { name, bio } = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Create author:", { name, bio });
    return NextResponse.json({ id: "mock-new-author", name, bio });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const author = await prisma.author.create({
    data: { name, bio },
  });

  return NextResponse.json(author);
}
