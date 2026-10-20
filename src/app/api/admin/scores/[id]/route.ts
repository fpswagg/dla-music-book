import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { queueScoreAudio, retryConversion, reviewScore, setDefaultScore, updateScore } from "@/lib/scores";
import { parseBody, scoreReview } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Moderation of a score: publish, reject, back to draft, make default, retry conversion, edit labels. */
export async function PATCH(request: Request, { params }: Ctx) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const parsed = await parseBody(request, scoreReview);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { action, note, instrument, ...fields } = parsed.data;
  try {
    switch (action) {
      case "publish":
      case "reject":
      case "unpublish":
        return NextResponse.json({ score: await reviewScore(id, action, admin, note) });
      case "default":
        await setDefaultScore(id);
        return NextResponse.json({ ok: true });
      case "retry":
        await retryConversion(id);
        return NextResponse.json({ ok: true });
      case "edit":
        return NextResponse.json({ score: await updateScore(id, fields) });
      case "render":
      case "sing":
        await queueScoreAudio(id, action, admin, instrument);
        return NextResponse.json({ ok: true, queued: true }, { status: 202 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_CONVERTED" || msg === "NO_SONGS") return jsonError(msg, 409);
    return jsonError("Not found", 404);
  }
}
