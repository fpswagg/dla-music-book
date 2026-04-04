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

  const { key, name, category } = await request.json();

  if (isMockMode()) {
    console.log("[Mock] Create tag:", { key, name, category });
    return NextResponse.json({ id: "mock-new-tag", key, name, category });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const tag = await prisma.tag.create({
    data: { key, name, category },
  });

  return NextResponse.json(tag);
}
