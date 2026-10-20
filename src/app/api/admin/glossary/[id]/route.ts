import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { removeGlossaryTerm } from "@/lib/recordings";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    await removeGlossaryTerm(id);
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Not found", 404);
  }
}
