import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { createScore, getMyScores } from "@/lib/scores";
import { MAX_SCORE_BYTES } from "@/lib/music/score-format";
import { scoreKinds } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

/** The signed-in contributor's own uploads. */
export async function GET() {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ scores: await getMyScores(user) });
}

/** Upload a score (MusicXML, .mxl, ABC, MEI, MIDI, MuseScore). Always saved as a draft for review. */
export async function POST(request: Request) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const tuneId = String(form?.get("tuneId") ?? "");
  const label = String(form?.get("label") ?? "").trim().slice(0, 120);
  const kind = String(form?.get("kind") ?? "SATB") as (typeof scoreKinds)[number];
  const source = String(form?.get("source") ?? "").trim().slice(0, 500);
  const license = String(form?.get("license") ?? "").trim().slice(0, 120);

  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (file.size > MAX_SCORE_BYTES) return jsonError("FILE_TOO_LARGE", 413);
  if (!scoreKinds.includes(kind)) return jsonError("Invalid kind", 400);
  if (!label) return jsonError("Missing label", 400);
  if (!(await prisma!.tune.findUnique({ where: { id: tuneId }, select: { id: true } }))) return jsonError("Unknown tune", 404);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await createScore({ tuneId, label, kind, fileName: file.name, bytes, source, license }, user);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNSUPPORTED_FORMAT") return jsonError("UNSUPPORTED_FORMAT", 415);
    if (msg === "STORAGE_NOT_CONFIGURED") return jsonError(msg, 503);
    console.error("Score upload failed:", err);
    return jsonError("UPLOAD_FAILED", 502);
  }
}
