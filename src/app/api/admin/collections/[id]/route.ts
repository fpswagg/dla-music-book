import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import type { CollectionStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const raw = (await request.json()) as Record<string, unknown>;

  if (isMockMode()) {
    console.log("[Mock] Update collection:", id, raw);
    return NextResponse.json({ id, ...raw });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const data: Prisma.CollectionUpdateInput = {};
  if (raw.name !== undefined) data.name = raw.name as Prisma.InputJsonValue;
  if (raw.description !== undefined) data.description = raw.description as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  if (raw.userId !== undefined) data.user = { connect: { id: String(raw.userId) } };

  const st = raw.status as string | undefined;
  if (st === "PUBLIC" || st === "PRIVATE" || st === "PENDING_REVIEW") {
    data.status = st as CollectionStatus;
    data.isPublic = st === "PUBLIC";
  }

  const collection = await prisma.collection.update({
    where: { id },
    data,
  });

  return NextResponse.json(collection);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (isMockMode()) {
    console.log("[Mock] Delete collection:", id);
    return NextResponse.json({ success: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  await prisma.collection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
