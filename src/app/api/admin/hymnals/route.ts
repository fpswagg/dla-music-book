import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { hymnalInput, parseBody } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const parsed = await parseBody(request, hymnalInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (await prisma.hymnal.findUnique({ where: { code: parsed.data.code } })) {
    return NextResponse.json({ error: "CODE_TAKEN" }, { status: 409 });
  }
  const hymnal = await prisma.hymnal.create({ data: parsed.data });
  return NextResponse.json(hymnal, { status: 201 });
}
