import { isClientMockMode } from "@/lib/env.client";

/**
 * Uploads an audio file to SA Storage (through the admin API route) and returns the public URL.
 * Duration is estimated from the file in the browser before upload.
 */
export async function uploadSongPreviewFile(
  file: File,
  songId: string,
  versionId: string,
): Promise<{ publicUrl: string; durationSeconds: number }> {
  const objUrl = URL.createObjectURL(file);
  const audio = new Audio(objUrl);
  const durationSeconds = await new Promise<number>((resolve) => {
    const finish = (n: number) => {
      URL.revokeObjectURL(objUrl);
      resolve(n);
    };
    audio.addEventListener(
      "loadedmetadata",
      () => finish(Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0),
      { once: true },
    );
    audio.addEventListener("error", () => finish(0), { once: true });
  });

  if (isClientMockMode()) {
    return { publicUrl: `https://example.com/mock-audio/${encodeURIComponent(file.name)}`, durationSeconds };
  }

  const form = new FormData();
  form.append("file", file);
  form.append("songId", songId);
  form.append("versionId", versionId);
  const res = await fetch("/api/admin/uploads/preview", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { publicUrl?: string; error?: string };
  if (!res.ok || !data.publicUrl) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  return { publicUrl: data.publicUrl, durationSeconds };
}
