import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { CollectionStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    userId,
    name,
    description,
    status,
  } = body as {
    userId?: string;
    name?: Record<string, string>;
    description?: Record<string, string> | null;
    status?: string;
  };

  if (!userId || !name || typeof name !== "object") {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock] Admin create collection", { userId, name });
    return NextResponse.json({ id: "mock-col-new" });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const st: CollectionStatus =
    status === "PUBLIC" || status === "PRIVATE" || status === "PENDING_REVIEW"
      ? status
      : "PRIVATE";

  const col = await prisma.collection.create({
    data: {
      userId,
      name: name as Prisma.InputJsonValue,
      description: (description ?? undefined) as Prisma.InputJsonValue | undefined,
      status: st,
      isPublic: st === "PUBLIC",
    },
  });

  return NextResponse.json({ id: col.id });
}
