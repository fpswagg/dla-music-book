import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { melodyToScore, reanalyzeRecording, reviewRecording, updateRecording } from "@/lib/recordings";
import { parseBody, recordingAdmin } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Moderation and editing of a recording (hymn, transcription, karaoke timing). */
export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const parsed = await parseBody(request, recordingAdmin);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { action, note, ...fields } = parsed.data;
  try {
    switch (action) {
      case "publish":
      case "reject":
      case "unpublish":
        return NextResponse.json({ recording: await reviewRecording(id, action, admin, note) });
      case "reanalyze":
        await reanalyzeRecording(id);
        return NextResponse.json({ ok: true });
      case "melodyToScore":
        return NextResponse.json(await melodyToScore(id, admin), { status: 201 });
      case "edit":
        return NextResponse.json({ recording: await updateRecording(id, fields, admin) });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (["NOT_READY", "NO_MELODY", "NO_TUNE"].includes(msg)) return jsonError(msg, 409);
    if (msg === "UNKNOWN_SONG") return jsonError(msg, 400);
    if (msg !== "NOT_FOUND") console.error("Recording admin action failed:", err);
    return jsonError(msg === "NOT_FOUND" ? "Not found" : "FAILED", msg === "NOT_FOUND" ? 404 : 500);
  }
}
