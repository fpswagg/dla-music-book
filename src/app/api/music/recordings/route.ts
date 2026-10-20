import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { listRecordings, startRecordingUpload } from "@/lib/recordings";
import { parseBody, recordingStart } from "@/lib/validation";

/** The signed-in contributor's recordings. */
export async function GET() {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ recordings: await listRecordings({ mine: user }) });
}

/** Start a chunked upload: returns the recording id and the chunk size to use. */
export async function POST(request: Request) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const parsed = await parseBody(request, recordingStart);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  try {
    return NextResponse.json(await startRecordingUpload(parsed.data, user), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "FILE_TOO_LARGE") return jsonError(msg, 413);
    if (msg === "UNSUPPORTED_FORMAT") return jsonError(msg, 415);
    if (msg === "UNKNOWN_SONG") return jsonError(msg, 404);
    if (msg === "STORAGE_NOT_CONFIGURED") return jsonError(msg, 503);
    console.error("Recording upload start failed:", err);
    return jsonError("UPLOAD_FAILED", 502);
  }
}
