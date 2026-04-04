import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { addMockUserCollection } from "@/lib/mock/provider";
import type { MockCollection } from "@/lib/mock/provider";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name as Record<string, string> | undefined;
  const description = body.description as Record<string, string> | undefined | null;

  if (!name || typeof name !== "object") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  if (isMockMode()) {
    const id = randomUUID();
    addMockUserCollection({
      id,
      userId: user.id,
      name: name as unknown as MockCollection["name"],
      description: (description ?? null) as unknown as MockCollection["description"],
      isPublic: false,
      status: "PRIVATE",
      songs: [],
    });
    return NextResponse.json({ id });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const col = await prisma.collection.create({
    data: {
      userId: user.id,
      name: name as Prisma.InputJsonValue,
      description: (description ?? undefined) as Prisma.InputJsonValue | undefined,
      status: "PRIVATE",
      isPublic: false,
    },
  });

  return NextResponse.json({ id: col.id });
}
