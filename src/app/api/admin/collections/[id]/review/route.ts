import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock] Review collection:", id, action);
    return NextResponse.json({ id, status: action === "approve" ? "PUBLIC" : "PRIVATE" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  if (action === "approve") {
    const collection = await prisma.collection.update({
      where: { id },
      data: { status: "PUBLIC", isPublic: true },
    });
    return NextResponse.json(collection);
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: { status: "PRIVATE", isPublic: false },
  });
  return NextResponse.json(collection);
}
