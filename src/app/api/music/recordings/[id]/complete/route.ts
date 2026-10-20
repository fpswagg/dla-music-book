import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { completeRecordingUpload } from "@/lib/recordings";
import { parseBody, recordingComplete } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** All chunks sent: queue the analysis on the server. */
export async function POST(request: Request, { params }: Ctx) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const parsed = await parseBody(request, recordingComplete);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  try {
    await completeRecordingUpload(id, parsed.data.chunks, user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return jsonError(msg || "Not found", msg === "FORBIDDEN" ? 403 : msg === "NOT_FOUND" ? 404 : 400);
  }
}
