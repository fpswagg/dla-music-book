import "server-only";
import type { Prisma, ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { canContribute, type AppUser } from "./auth-helpers";
import { deleteFile, downloadBytes, hasSaStorage, uploadFile } from "./sastorage";
import { enqueueJob } from "./jobs";
import { getLyricsContent } from "./lyrics";
import { sungLines, type AlignedLine } from "./audio/text-match";
import { createScore } from "./scores";

/**
 * Recordings of hymns (choirs, services). Upload in chunks (Vercel body limit), then the worker
 * transcodes, transcribes, matches the hymn, times the lines for karaoke and drafts the melody.
 * Everything stays a DRAFT until an admin checks it.
 */

export const MAX_RECORDING_BYTES = 150 * 1024 * 1024;
export const CHUNK_BYTES = 4 * 1024 * 1024;
export const MAX_CHUNKS = Math.ceil(MAX_RECORDING_BYTES / CHUNK_BYTES);
const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|mp4|3gp|amr|wma)$/i;

export const chunkKey = (id: string, n: number) => `tmp/uploads/${id}/${String(n).padStart(4, "0")}`;

const recordingSelect = {
  id: true,
  songId: true,
  title: true,
  performer: true,
  fileName: true,
  fileUrl: true,
  sizeBytes: true,
  durationMs: true,
  source: true,
  generator: true,
  status: true,
  analysis: true,
  analysisError: true,
  analysisLog: true,
  transcript: true,
  correctedText: true,
  matches: true,
  alignment: true,
  alignmentSource: true,
  melodyUrl: true,
  notes: true,
  reviewNote: true,
  createdById: true,
  createdAt: true,
  song: { select: { id: true, index: true, title: true, tuneId: true } },
  createdBy: { select: { displayName: true } },
} as const;

type Row = Prisma.RecordingGetPayload<{ select: typeof recordingSelect }>;

export type RecordingView = Omit<Row, "createdAt" | "createdBy" | "transcript" | "matches" | "alignment" | "analysisLog"> & {
  createdAt: string;
  createdBy: string | null;
  transcript: { provider: string; text: string; words: Array<{ w: string; start: number; end: number }> } | null;
  matches: Array<{ songId: string; index: number; title: string; score: number }>;
  alignment: AlignedLine[];
  analysisLog: Array<{ step: string; ok: boolean; info?: string; at: string }>;
};

const toView = (r: Row): RecordingView => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  createdBy: r.createdBy?.displayName ?? null,
  transcript: (r.transcript as RecordingView["transcript"]) ?? null,
  matches: (r.matches as RecordingView["matches"]) ?? [],
  alignment: (r.alignment as AlignedLine[]) ?? [],
  analysisLog: (r.analysisLog as RecordingView["analysisLog"]) ?? [],
});

export function canSeeRecording(r: { status: ReviewStatus; createdById: string | null }, user: AppUser | null) {
  if (r.status === "PUBLISHED") return true;
  if (!user) return false;
  return user.role === "ADMIN" || (canContribute(user) && r.createdById === user.id);
}

/** Step 1 of an upload: the row exists (analysis PENDING, no file yet) and chunks go under tmp/. */
export async function startRecordingUpload(
  input: { fileName: string; size: number; contentType?: string; songId?: string | null; songIndex?: number | null; title?: string; performer?: string },
  user: AppUser,
) {
  if (!prisma) throw new Error("Database unavailable");
  const songId = input.songId || (input.songIndex ? await songIdByIndex(input.songIndex) : null);
  if (!hasSaStorage()) throw new Error("STORAGE_NOT_CONFIGURED");
  if (input.size > MAX_RECORDING_BYTES) throw new Error("FILE_TOO_LARGE");
  if (!AUDIO_EXT.test(input.fileName) && !input.contentType?.startsWith("audio/") && !input.contentType?.startsWith("video/"))
    throw new Error("UNSUPPORTED_FORMAT");
  const rec = await prisma.recording.create({
    data: {
      songId,
      title: input.title?.slice(0, 200) || null,
      performer: input.performer?.slice(0, 200) || null,
      fileName: input.fileName.slice(0, 200),
      contentType: input.contentType?.slice(0, 100) || null,
      sizeBytes: input.size,
      source: "UPLOAD",
      createdById: user.id,
    },
    select: { id: true },
  });
  return { id: rec.id, chunkBytes: CHUNK_BYTES, chunks: Math.ceil(input.size / CHUNK_BYTES) };
}

async function ownUpload(id: string, user: AppUser) {
  const rec = await prisma!.recording.findUnique({ where: { id }, select: { createdById: true, fileKey: true, uploadId: true } });
  if (!rec) throw new Error("NOT_FOUND");
  if (rec.createdById !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  if (rec.fileKey || rec.uploadId) throw new Error("ALREADY_COMPLETE");
}

export async function putRecordingChunk(id: string, n: number, bytes: Uint8Array, user: AppUser) {
  await ownUpload(id, user);
  if (!Number.isInteger(n) || n < 0 || n >= MAX_CHUNKS || bytes.length > CHUNK_BYTES || !bytes.length) throw new Error("BAD_CHUNK");
  await uploadFile(chunkKey(id, n), bytes, "application/octet-stream", "private");
}

/** Last step: queue the analysis. `uploadId` records how many chunks the worker must join. */
export async function completeRecordingUpload(id: string, chunks: number, user: AppUser) {
  await ownUpload(id, user);
  if (!Number.isInteger(chunks) || chunks < 1 || chunks > MAX_CHUNKS) throw new Error("BAD_CHUNK");
  await prisma!.recording.update({ where: { id }, data: { uploadId: `chunks:${chunks}`, analysis: "PENDING" } });
  await enqueueJob("recording.analyze", { id });
}

export async function getRecording(id: string, user: AppUser | null): Promise<RecordingView | null> {
  if (!prisma) return null;
  const r = await prisma.recording.findUnique({ where: { id }, select: recordingSelect });
  return r && canSeeRecording(r, user) ? toView(r) : null;
}

export async function listRecordings(filter: { status?: ReviewStatus; mine?: AppUser } = {}) {
  if (!prisma) return [];
  const rows = await prisma.recording.findMany({
    where: { ...(filter.status ? { status: filter.status } : {}), ...(filter.mine ? { createdById: filter.mine.id } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: recordingSelect,
  });
  return rows.map(toView);
}

/** Published recordings of a hymn (plus drafts for their author and admins), with karaoke lines. */
export async function getSongRecordings(songId: string, user: AppUser | null) {
  if (!prisma) return [];
  const rows = await prisma.recording.findMany({
    where: { songId, fileUrl: { not: null }, status: { not: "REJECTED" } },
    orderBy: [{ status: "desc" }, { createdAt: "asc" }],
    select: recordingSelect,
  });
  return rows.filter((r) => canSeeRecording(r, user)).map(toView);
}

/** Sung lines of a hymn (latest version), for the alignment editor. */
export async function getSungLines(songId: string): Promise<string[]> {
  if (!prisma) return [];
  const v = await prisma.songVersion.findFirst({ where: { songId }, orderBy: { versionNumber: "desc" }, select: { content: true, lyrics: true } });
  return v ? sungLines(getLyricsContent(v)) : [];
}

async function songIdByIndex(index: number) {
  const song = await prisma!.song.findUnique({ where: { index }, select: { id: true } });
  if (!song) throw new Error("UNKNOWN_SONG");
  return song.id;
}

export type RecordingPatch = {
  songId?: string | null;
  songIndex?: number | null;
  title?: string | null;
  performer?: string | null;
  notes?: string | null;
  correctedText?: string | null;
  alignment?: AlignedLine[];
};

/** Admin edits. A validated transcription correction is kept as a sample to teach later corrections. */
export async function updateRecording(id: string, patch: RecordingPatch, admin: AppUser) {
  if (!prisma) throw new Error("Database unavailable");
  const rec = await prisma.recording.findUnique({ where: { id }, select: { transcript: true, correctedText: true, songId: true } });
  if (!rec) throw new Error("NOT_FOUND");
  const data: Prisma.RecordingUncheckedUpdateInput = {};
  if (patch.songId !== undefined) data.songId = patch.songId;
  if (patch.songIndex) data.songId = await songIdByIndex(patch.songIndex);
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.performer !== undefined) data.performer = patch.performer;
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (patch.correctedText !== undefined) data.correctedText = patch.correctedText;
  if (patch.alignment !== undefined) {
    data.alignment = patch.alignment as unknown as Prisma.InputJsonValue;
    data.alignmentSource = "manual";
  }
  const updated = await prisma.recording.update({ where: { id }, data, select: recordingSelect });

  const raw = (rec.transcript as { text?: string } | null)?.text?.trim();
  const corrected = patch.correctedText?.trim();
  if (raw && corrected && corrected !== rec.correctedText?.trim()) {
    await prisma.transcriptionSample.create({
      data: { recordingId: id, songId: updated.songId, rawText: raw.slice(0, 20000), correctedText: corrected.slice(0, 20000) },
    });
  }
  void admin;
  return toView(updated);
}

export async function reviewRecording(id: string, action: "publish" | "reject" | "unpublish", admin: AppUser, note?: string) {
  if (!prisma) throw new Error("Database unavailable");
  const rec = await prisma.recording.findUnique({ where: { id }, select: { fileUrl: true, songId: true } });
  if (!rec) throw new Error("NOT_FOUND");
  if (action === "publish" && (!rec.fileUrl || !rec.songId)) throw new Error("NOT_READY");
  const status: ReviewStatus = action === "publish" ? "PUBLISHED" : action === "reject" ? "REJECTED" : "DRAFT";
  return toView(
    await prisma.recording.update({
      where: { id },
      data: { status, reviewedById: admin.id, reviewedAt: new Date(), reviewNote: note?.slice(0, 1000) || null },
      select: recordingSelect,
    }),
  );
}

export async function reanalyzeRecording(id: string) {
  if (!prisma) throw new Error("Database unavailable");
  await prisma.recording.update({ where: { id }, data: { analysis: "PENDING", analysisError: null } });
  await enqueueJob("recording.analyze", { id });
}

/** The Basic Pitch melody becomes a draft score of the hymn's tune (converted by MuseScore). */
export async function melodyToScore(id: string, admin: AppUser) {
  if (!prisma) throw new Error("Database unavailable");
  const rec = await prisma.recording.findUnique({ where: { id }, select: { melodyKey: true, title: true, song: { select: { index: true, tuneId: true } } } });
  if (!rec?.melodyKey) throw new Error("NO_MELODY");
  if (!rec.song?.tuneId) throw new Error("NO_TUNE");
  const bytes = await downloadBytes(rec.melodyKey);
  if (!bytes) throw new Error("NO_MELODY");
  return createScore(
    { tuneId: rec.song.tuneId, label: `Mélodie (brouillon auto) #${rec.song.index}`, kind: "MELODY", fileName: "melody.mid", bytes, source: `recording:${id}` },
    admin,
  );
}

/** Delete a recording that never finished uploading (its chunks too). Media of finished ones stay. */
export async function discardUpload(id: string, user: AppUser) {
  await ownUpload(id, user);
  for (let n = 0; n < MAX_CHUNKS; n++) {
    try {
      await deleteFile(chunkKey(id, n));
    } catch {
      break;
    }
  }
  await prisma!.recording.delete({ where: { id } });
}

// --- Glossary (Duala words the transcription keeps getting wrong) ---

export async function listGlossary() {
  if (!prisma) return [];
  return prisma.glossaryTerm.findMany({ orderBy: { term: "asc" } });
}

export async function addGlossaryTerm(term: string, note?: string | null) {
  if (!prisma) throw new Error("Database unavailable");
  const clean = term.normalize("NFC").trim().slice(0, 120);
  if (!clean) throw new Error("EMPTY");
  return prisma.glossaryTerm.upsert({ where: { term: clean }, update: { note: note || null }, create: { term: clean, note: note || null } });
}

export async function removeGlossaryTerm(id: string) {
  if (!prisma) throw new Error("Database unavailable");
  await prisma.glossaryTerm.delete({ where: { id } });
}

/** Status shown in the admin: what the analysis can do with the keys of the worker's environment. */
export async function recordingCounts() {
  if (!prisma) return { drafts: 0 };
  return { drafts: await prisma.recording.count({ where: { status: "DRAFT", fileUrl: { not: null } } }) };
}
