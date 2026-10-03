import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { banned } = (await request.json().catch(() => ({}))) as { banned?: boolean };
  if (admin.id === id) return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });

  if (isMockMode()) return NextResponse.json({ ok: true });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { banned: !!banned } }),
    // Banning signs the user out everywhere; sign-in is refused while banned (src/lib/auth.ts).
    ...(banned ? [prisma.session.deleteMany({ where: { userId: id } })] : []),
  ]);
  return NextResponse.json({ ok: true, banned: !!banned });
}
