import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { hasSaStorage, publicFileUrl, uploadFile } from "@/lib/sastorage";
import { isMockMode } from "@/lib/config";

// Vercel caps serverless request bodies at ~4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Upload a song preview (audio) to SA Storage. Admin only. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isMockMode()) {
    return NextResponse.json({ publicUrl: "https://example.com/demo-audio.mp3", key: "demo" }, { status: 201 });
  }
  if (!hasSaStorage()) {
    return NextResponse.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const songId = String(form?.get("songId") ?? "");
  const versionId = String(form?.get("versionId") ?? "");

  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!SAFE_ID.test(songId) || !SAFE_ID.test(versionId)) {
    return NextResponse.json({ error: "Invalid song or version id" }, { status: 400 });
  }
  if (file.type && !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Only audio files are allowed" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4 MB)" }, { status: 413 });
  }

  const rawExt = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "mp3";
  const ext = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "mp3";
  const key = `previews/${songId}/${versionId}/${crypto.randomUUID()}.${ext}`;

  try {
    const object = await uploadFile(key, file, file.type || "audio/mpeg");
    return NextResponse.json({ publicUrl: publicFileUrl(object.key), key: object.key }, { status: 201 });
  } catch (err) {
    console.error("Preview upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
