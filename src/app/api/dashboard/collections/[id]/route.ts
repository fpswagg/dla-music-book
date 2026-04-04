import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import type { CollectionStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { removeMockUserCollection, updateMockUserCollection } from "@/lib/mock/provider";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (isMockMode()) {
    const st = body.status as CollectionStatus | undefined;
    const patch: Parameters<typeof updateMockUserCollection>[1] = {
      name: body.name,
      description: body.description,
    };
    if (st === "PUBLIC" || st === "PRIVATE" || st === "PENDING_REVIEW") {
      patch.status = st;
      patch.isPublic = st === "PUBLIC";
    }
    updateMockUserCollection(id, patch);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const existing = await prisma.collection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Prisma.CollectionUpdateInput = {};
  if (body.name !== undefined) data.name = body.name as Prisma.InputJsonValue;
  if (body.description !== undefined) data.description = body.description as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  const st = body.status as string | undefined;
  if (st === "PUBLIC" || st === "PRIVATE" || st === "PENDING_REVIEW") {
    data.status = st as CollectionStatus;
    data.isPublic = st === "PUBLIC";
  }

  await prisma.collection.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (isMockMode()) {
    removeMockUserCollection(id);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const existing = await prisma.collection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
