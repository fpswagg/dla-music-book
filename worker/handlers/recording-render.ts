import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { downloadBytes, publicFileUrl, uploadFile, uploadLargeFile } from "@/lib/sastorage";
import { getLyricsContent, plainLyrics } from "@/lib/lyrics";
import { setMidiProgram, type Instrument } from "@/lib/audio/midi-program";
import { flags, singFromScore } from "../ai";
import { inTools, musescore, withTempDir } from "../tools";

const SOUNDFONT = "/usr/share/sounds/sf2/FluidR3_GM.sf2";
const INSTRUMENT_LABEL: Record<Instrument, string> = { organ: "Orgue", piano: "Piano", choir: "Chœur (synthèse)" };

async function put(key: string, bytes: Uint8Array, type: string) {
  return bytes.length > 4 * 1024 * 1024 ? uploadLargeFile(key, bytes, type) : uploadFile(key, bytes, type);
}

/** The score as a file MuseScore can read: the original (.mscz/.mid) when there is one, else the stored MusicXML/MEI. */
async function scoreInput(score: { fileKey: string | null; format: string | null; originalKey: string | null; originalFormat: string | null }) {
  if (score.originalKey && (score.originalFormat === "mscz" || score.originalFormat === "midi")) {
    const bytes = await downloadBytes(score.originalKey);
    if (bytes) return { bytes, ext: score.originalFormat === "midi" ? "mid" : "mscz" };
  }
  if (!score.fileKey || !score.format) throw new Error("Score not converted yet");
  if (score.format === "ABC") throw new Error("ABC scores cannot be rendered yet: upload MusicXML or MIDI");
  const bytes = await downloadBytes(score.fileKey);
  if (!bytes) throw new Error("Score file not found in storage");
  return { bytes, ext: score.format === "MEI" ? "mei" : score.fileKey.endsWith(".mxl") ? "mxl" : "musicxml" };
}

/** Attach one audio file to every hymn sung to the tune (one DRAFT recording per hymn, updated on re-render). */
async function attach(input: {
  scoreId: string;
  songIds: string[];
  generator: string;
  source: "RENDER" | "AI";
  title: string;
  fileKey: string;
  durationMs: number | null;
  sizeBytes: number;
  createdById: string | null;
}) {
  const db = prisma!;
  const ids: string[] = [];
  for (const songId of input.songIds) {
    const existing = await db.recording.findFirst({ where: { scoreId: input.scoreId, songId, generator: input.generator } });
    const data = {
      fileKey: input.fileKey,
      fileUrl: publicFileUrl(input.fileKey),
      contentType: "audio/mpeg",
      durationMs: input.durationMs,
      sizeBytes: input.sizeBytes,
      analysis: "DONE" as const,
      analysisError: null,
    };
    const rec = existing
      ? await db.recording.update({ where: { id: existing.id }, data })
      : await db.recording.create({
          data: { ...data, songId, scoreId: input.scoreId, source: input.source, generator: input.generator, title: input.title, createdById: input.createdById },
        });
    ids.push(rec.id);
  }
  return ids;
}

async function loadScore(scoreId: string) {
  const score = await prisma!.scoreFile.findUnique({
    where: { id: scoreId },
    include: { tune: { select: { name: true, songs: { select: { id: true }, orderBy: { index: "asc" } } } } },
  });
  if (!score) throw new Error("Score deleted");
  if (!score.tune.songs.length) throw new Error("The tune is not linked to any hymn");
  return score;
}

async function toMp3(dir: string, input: string) {
  await inTools(dir, ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", `/work/${input}`, "-af", "loudnorm=I=-16:TP=-1.5", "-c:a", "libmp3lame", "-b:a", "192k", "/work/out.mp3"], 10 * 60_000);
  const probe = await inTools(dir, ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "/work/out.mp3"]);
  const seconds = Number(probe.stdout.trim());
  return { mp3: new Uint8Array(await readFile(join(dir, "out.mp3"))), durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null };
}

/** Score → MIDI (MuseScore) → one GM instrument → audio (FluidSynth) → MP3, attached to the tune's hymns. */
export async function recordingRender(payload: { scoreId: string; instrument: Instrument; userId?: string }) {
  const score = await loadScore(payload.scoreId);
  return withTempDir(async (dir) => {
    const input = await scoreInput(score);
    await writeFile(join(dir, `in.${input.ext}`), input.bytes);
    if (input.ext !== "mid") await inTools(dir, musescore(["-o", "/work/score.mid", `/work/in.${input.ext}`]));
    const midi = new Uint8Array(await readFile(join(dir, input.ext === "mid" ? "in.mid" : "score.mid")));
    await writeFile(join(dir, "render.mid"), setMidiProgram(midi, payload.instrument));
    await inTools(dir, ["fluidsynth", "-ni", "-q", "-g", "0.8", "-r", "44100", "-F", "/work/out.wav", SOUNDFONT, "/work/render.mid"], 10 * 60_000);
    const { mp3, durationMs } = await toMp3(dir, "out.wav");
    const stored = await put(`renders/${score.id}/${payload.instrument}.mp3`, mp3, "audio/mpeg");
    const ids = await attach({
      scoreId: score.id,
      songIds: score.tune.songs.map((s) => s.id),
      generator: `render:${payload.instrument}`,
      source: "RENDER",
      title: `${score.label} · ${INSTRUMENT_LABEL[payload.instrument]}`,
      fileKey: stored.key,
      durationMs,
      sizeBytes: mp3.length,
      createdById: payload.userId ?? null,
    });
    return { recordings: ids, durationMs };
  });
}

/**
 * Experimental: sung by an AI voice from the score and the hymn's own lyrics (never invented).
 * Always a DRAFT labelled "AI generated"; an admin listens before publishing.
 */
export async function recordingSing(payload: { scoreId: string; voice?: string; userId?: string }) {
  if (!flags.singing()) throw new Error("AI singing not configured: AI_SINGING_URL missing");
  const score = await loadScore(payload.scoreId);
  const db = prisma!;
  return withTempDir(async (dir) => {
    const input = await scoreInput(score);
    let musicxml: string;
    if (input.ext === "musicxml") musicxml = new TextDecoder().decode(input.bytes);
    else {
      await writeFile(join(dir, `in.${input.ext}`), input.bytes);
      await inTools(dir, musescore(["-o", "/work/score.musicxml", `/work/in.${input.ext}`]));
      musicxml = await readFile(join(dir, "score.musicxml"), "utf8");
    }
    const v = await db.songVersion.findFirst({ where: { songId: score.tune.songs[0].id }, orderBy: { versionNumber: "desc" }, select: { content: true, lyrics: true } });
    const lyrics = v ? plainLyrics(getLyricsContent(v)) : "";
    const sung = await singFromScore({ musicxml, lyrics, voice: payload.voice });
    await writeFile(join(dir, "sung.bin"), sung.audio);
    const { mp3, durationMs } = await toMp3(dir, "sung.bin");
    const stored = await put(`renders/${score.id}/ai-${payload.voice ?? "default"}.mp3`, mp3, "audio/mpeg");
    const ids = await attach({
      scoreId: score.id,
      songIds: score.tune.songs.map((s) => s.id),
      generator: `ai:${sung.generator}`,
      source: "AI",
      title: `${score.label} · voix IA`,
      fileKey: stored.key,
      durationMs,
      sizeBytes: mp3.length,
      createdById: payload.userId ?? null,
    });
    return { recordings: ids, durationMs };
  });
}
