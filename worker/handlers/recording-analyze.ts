import { readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteFile, downloadBytes, listFiles, publicFileUrl, uploadFile, uploadLargeFile } from "@/lib/sastorage";
import { getLyricsContent, plainLyrics } from "@/lib/lyrics";
import { alignLines, rankSongs, sungLines } from "@/lib/audio/text-match";
import { claudeCorrect, flags, geminiTranscribe, whisperTranscribe, type Transcript } from "../ai";
import { inTools, run, withTempDir } from "../tools";

export const PITCH_IMAGE = process.env.MYENGE_PITCH_IMAGE ?? "myenge-pitch";

type LogEntry = { step: string; ok: boolean; info?: string; at: string };

/** Auto-pick the hymn only when the best match is clear. */
const AUTO_MATCH = 0.55;
const AUTO_MARGIN = 0.12;

async function put(key: string, bytes: Uint8Array, type: string, visibility: "public" | "private" = "public") {
  return bytes.length > 4 * 1024 * 1024 ? uploadLargeFile(key, bytes, type, visibility) : uploadFile(key, bytes, type, visibility);
}

/**
 * The full analysis of an uploaded recording. Only the audio ingest is required; every AI step
 * is skipped (and reported) when its key is missing or it fails.
 */
export async function recordingAnalyze(payload: { id: string }) {
  const db = prisma!;
  const rec = await db.recording.findUnique({ where: { id: payload.id } });
  if (!rec) return { skipped: "recording deleted" };
  await db.recording.update({ where: { id: rec.id }, data: { analysis: "RUNNING", analysisError: null } });

  const log: LogEntry[] = [];
  const note = (step: string, ok: boolean, info?: string) => log.push({ step, ok, info: info?.slice(0, 300), at: new Date().toISOString() });
  const save = (data: Prisma.RecordingUncheckedUpdateInput) =>
    db.recording.update({ where: { id: rec.id }, data: { ...data, analysisLog: log as unknown as Prisma.InputJsonValue } });

  return withTempDir(async (dir) => {
    // 1. Audio: join the uploaded chunks, transcode to MP3 (public), keep the original (private).
    let fileKey = rec.fileKey;
    if (!fileKey) {
      const expected = Number(rec.uploadId?.replace("chunks:", "") ?? 0);
      const chunks = (await listFiles(`tmp/uploads/${rec.id}/`)).sort((a, b) => a.key.localeCompare(b.key));
      if (!expected || chunks.length !== expected) throw new Error(`Upload incomplete: ${chunks.length}/${expected} chunks`);
      const parts: Uint8Array[] = [];
      for (const c of chunks) {
        const b = await downloadBytes(c.key);
        if (!b) throw new Error(`Chunk missing: ${c.key}`);
        parts.push(b);
      }
      await writeFile(join(dir, "in.bin"), Buffer.concat(parts));
      await inTools(dir, ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", "/work/in.bin", "-vn", "-c:a", "libmp3lame", "-b:a", "160k", "/work/audio.mp3"], 15 * 60_000);
      const mp3 = new Uint8Array(await readFile(join(dir, "audio.mp3")));
      const ext = (rec.fileName?.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1] ?? "bin").replace(/[^a-z0-9]/g, "");
      await put(`recordings/${rec.id}/original.${ext}`, new Uint8Array(await readFile(join(dir, "in.bin"))), rec.contentType ?? "application/octet-stream", "private");
      const stored = await put(`recordings/${rec.id}/audio.mp3`, mp3, "audio/mpeg");
      fileKey = stored.key;
      const probe = await inTools(dir, ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "/work/audio.mp3"]);
      const seconds = Number(probe.stdout.trim());
      await save({ fileKey, fileUrl: publicFileUrl(fileKey), contentType: "audio/mpeg", durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null, uploadId: null });
      for (const c of chunks) await deleteFile(c.key).catch(() => {});
      note("audio", true, `${Math.round(seconds)} s`);
    } else {
      const bytes = await downloadBytes(fileKey);
      if (!bytes) throw new Error("Audio file not found in storage");
      await writeFile(join(dir, "audio.mp3"), bytes);
      note("audio", true, "existing file");
    }

    // Light copies for the transcription (16 kHz mono) and the melody (22 kHz mono WAV).
    await inTools(dir, ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", "/work/audio.mp3", "-ac", "1", "-ar", "16000", "-b:a", "32k", "/work/asr.mp3"], 10 * 60_000);

    const songs = await db.song.findMany({ select: { id: true, index: true, title: true, searchText: true } });
    const glossary = await db.glossaryTerm.findMany({ orderBy: { term: "asc" }, take: 300 });
    let songId = rec.songId;
    const lyricsOf = async (id: string) => {
      const v = await db.songVersion.findFirst({ where: { songId: id }, orderBy: { versionNumber: "desc" }, select: { content: true, lyrics: true } });
      return v ? getLyricsContent(v) : null;
    };

    // 2. Transcription (Whisper, else Gemini).
    let transcript: Transcript | null = null;
    if (!flags.whisper() && !flags.gemini()) note("transcription", false, "skipped: OPENAI_API_KEY or GEMINI_API_KEY missing");
    else {
      const known = songId ? await lyricsOf(songId) : null;
      const prompt = known ? plainLyrics(known).replace(/\s+/g, " ").slice(0, 700) : glossary.map((g) => g.term).join(", ").slice(0, 700);
      const asr = new Uint8Array(await readFile(join(dir, "asr.mp3")));
      try {
        transcript = flags.whisper() ? await whisperTranscribe(asr, prompt) : await geminiTranscribe(asr, prompt);
        note("transcription", true, `${transcript.provider}, ${transcript.words.length} words`);
        await save({ transcript: transcript as unknown as Prisma.InputJsonValue });
      } catch (err) {
        note("transcription", false, (err as Error).message);
      }
    }

    // 3. Which hymn is it?
    if (transcript?.text) {
      const matches = rankSongs(transcript.text, songs);
      const [top, second] = matches;
      let info = top ? `#${top.index} (${top.score})` : "no match";
      if (!songId && top && top.score >= AUTO_MATCH && (!second || top.score - second.score >= AUTO_MARGIN)) {
        songId = top.songId;
        info += ", picked";
      }
      note("match", !!top, info);
      await save({ matches: matches as unknown as Prisma.InputJsonValue, songId });
    }

    // 4. Correction by Claude (draft for a human).
    if (transcript?.text) {
      if (!flags.claude()) note("correction", false, "skipped: ANTHROPIC_API_KEY missing");
      else {
        try {
          const samples = await db.transcriptionSample.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
          const ref = songId ? await lyricsOf(songId) : null;
          const out = await claudeCorrect({ text: transcript.text, glossary, samples, reference: ref ? plainLyrics(ref) : null });
          note("correction", true, out.model);
          if (!rec.correctedText) await save({ correctedText: out.text });
        } catch (err) {
          note("correction", false, (err as Error).message);
        }
      }
    }

    // 5. Karaoke timing of the hymn's lines.
    if (songId && transcript?.words.length && rec.alignmentSource !== "manual") {
      const content = await lyricsOf(songId);
      const lines = content ? sungLines(content) : [];
      const alignment = alignLines(lines, transcript.words);
      note("alignment", alignment.length > 0, `${alignment.length}/${lines.length} lines`);
      if (alignment.length) await save({ alignment: alignment as unknown as Prisma.InputJsonValue, alignmentSource: "auto" });
    } else if (rec.alignmentSource === "manual") note("alignment", true, "kept manual timing");
    else note("alignment", false, songId ? "no word timestamps" : "hymn unknown");

    // 6. Melody draft (Basic Pitch → MIDI).
    try {
      await inTools(dir, ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", "/work/audio.mp3", "-t", "900", "-ac", "1", "-ar", "22050", "/work/pitch.wav"], 10 * 60_000);
      const uid = process.getuid?.() ?? 1000;
      const gid = process.getgid?.() ?? 1000;
      await run(
        "docker",
        ["run", "--rm", "--network", "none", "--memory", "3g", "--cpus", "2", "-u", `${uid}:${gid}`, "-v", `${dir}:/work`, PITCH_IMAGE,
          "sh", "-c", "ulimit -c 0; mkdir -p /work/pitch && basic-pitch /work/pitch /work/pitch.wav"],
        20 * 60_000,
      );
      const midPath = join(dir, "pitch", "pitch_basic_pitch.mid");
      await stat(midPath);
      const stored = await put(`recordings/${rec.id}/melody.mid`, new Uint8Array(await readFile(midPath)), "audio/midi");
      await save({ melodyKey: stored.key, melodyUrl: publicFileUrl(stored.key) });
      note("melody", true, "basic-pitch");
    } catch (err) {
      note("melody", false, (err as Error).message.split("\n")[0]);
    }

    await save({ analysis: "DONE", analysisError: null });
    return { log };
  });
}

export async function recordingAnalyzeFailed(payload: { id: string }, error: string) {
  await prisma!.recording.updateMany({ where: { id: payload.id }, data: { analysis: "FAILED", analysisError: error.slice(0, 500) } });
}
