import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { discardUpload } from "@/lib/recordings";

type Ctx = { params: Promise<{ id: string }> };

/** Abandon an upload that did not finish. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  try {
    await discardUpload(id, user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return jsonError(msg || "Not found", msg === "FORBIDDEN" ? 403 : msg === "ALREADY_COMPLETE" ? 409 : 404);
  }
}
