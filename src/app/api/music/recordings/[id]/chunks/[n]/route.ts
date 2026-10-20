import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { putRecordingChunk } from "@/lib/recordings";

type Ctx = { params: Promise<{ id: string; n: string }> };

/** One piece of the audio file (raw bytes, at most 4 MB), stored privately until the worker joins them. */
export async function PUT(request: Request, { params }: Ctx) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const { id, n } = await params;
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    await putRecordingChunk(id, Number(n), bytes, user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FORBIDDEN") return jsonError(msg, 403);
    if (msg === "NOT_FOUND") return jsonError(msg, 404);
    if (msg === "BAD_CHUNK" || msg === "ALREADY_COMPLETE") return jsonError(msg, 400);
    console.error("Recording chunk failed:", err);
    return jsonError("UPLOAD_FAILED", 502);
  }
}
