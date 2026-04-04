import { createClient } from "@/lib/supabase/client";
import { isClientMockMode } from "@/lib/env.client";

const BUCKET = "song-previews";

/**
 * Uploads an audio file to Supabase Storage and returns the public URL.
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

  const supabase = createClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "mp3";
  const path = `previews/${songId}/${versionId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, durationSeconds };
}
