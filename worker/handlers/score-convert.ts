import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { downloadBytes, publicFileUrl, uploadFile } from "@/lib/sastorage";
import { contentTypeFor, prepareScore, readScoreMeta } from "@/lib/music/score-format";
import { inTools, musescore, withTempDir } from "../tools";

/** MIDI / MuseScore file → MusicXML with MuseScore, then stored next to the original. */
export async function scoreConvert(payload: { id: string }) {
  const db = prisma!;
  const score = await db.scoreFile.findUnique({ where: { id: payload.id } });
  if (!score) return { skipped: "score deleted" };
  if (!score.originalKey) throw new Error("No original file");
  const bytes = await downloadBytes(score.originalKey);
  if (!bytes) throw new Error("Original file not found in storage");

  const ext = score.originalFormat === "mscz" ? "mscz" : score.originalFormat === "midi" ? "mid" : (score.originalKey.split(".").pop() ?? "bin");
  const xml = await withTempDir(async (dir) => {
    await writeFile(join(dir, `in.${ext}`), bytes);
    await inTools(dir, musescore(["-o", "/work/out.musicxml", `/work/in.${ext}`]));
    return readFile(join(dir, "out.musicxml"), "utf8");
  });

  const prepared = prepareScore("score.musicxml", new TextEncoder().encode(xml));
  if (prepared.needsConversion) throw new Error("MuseScore output is not MusicXML");
  const stored = await uploadFile(`scores/${score.tuneId}/${score.id}/score.musicxml`, prepared.content, contentTypeFor(prepared.format));
  await db.scoreFile.update({
    where: { id: score.id },
    data: { format: prepared.format, fileKey: stored.key, fileUrl: publicFileUrl(stored.key), conversion: "READY", conversionError: null },
  });

  const meta = readScoreMeta(prepared.content, prepared.format);
  const tune = await db.tune.findUnique({ where: { id: score.tuneId } });
  if (tune) {
    const patch: Record<string, string> = {};
    if (!tune.key && meta.key) patch.key = meta.key;
    if (!tune.timeSignature && meta.timeSignature) patch.timeSignature = meta.timeSignature;
    if (Object.keys(patch).length) await db.tune.update({ where: { id: tune.id }, data: patch });
  }
  return { fileKey: stored.key, meta };
}

export async function scoreConvertFailed(payload: { id: string }, error: string) {
  await prisma!.scoreFile.updateMany({ where: { id: payload.id }, data: { conversion: "FAILED", conversionError: error.slice(0, 500) } });
}
