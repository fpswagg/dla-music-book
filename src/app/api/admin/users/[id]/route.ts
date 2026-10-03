import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { role } = (await request.json().catch(() => ({}))) as { role?: string };
  if (role !== "USER" && role !== "ADMIN") return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (admin.id === id) return NextResponse.json({ error: "Cannot change own role" }, { status: 400 });

  if (isMockMode()) return NextResponse.json({ id, role });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, role: true } });
  return NextResponse.json(user);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (admin.id === id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Notes and annotations written by this user are reassigned to the admin, not lost.
  await prisma.$transaction([
    prisma.annotation.updateMany({ where: { createdById: id }, data: { createdById: admin.id } }),
    prisma.songNote.updateMany({ where: { createdById: id }, data: { createdById: admin.id } }),
    prisma.user.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
