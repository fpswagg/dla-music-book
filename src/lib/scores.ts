import "server-only";
import type { ScoreKind, ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import type { AppUser } from "./auth-helpers";
import { canContribute } from "./auth-helpers";
import { uploadFile, publicFileUrl, hasSaStorage } from "./sastorage";
import { contentTypeFor, extensionFor, prepareScore, readScoreMeta, type ScoreMeta } from "./music/score-format";
import { enqueueJob } from "./jobs";

/** Tunes and their scores. Every upload starts as DRAFT and waits for an admin (moderation queue). */

export type ScoreView = {
  id: string;
  tuneId: string;
  label: string;
  kind: ScoreKind;
  format: string | null;
  status: ReviewStatus;
  conversion: string;
  conversionError: string | null;
  isDefault: boolean;
  source: string | null;
  license: string | null;
  originalName: string | null;
  originalUrl: string | null;
  createdBy: string | null;
  createdById: string | null;
  reviewNote: string | null;
  createdAt: string;
};

const scoreSelect = {
  id: true,
  tuneId: true,
  label: true,
  kind: true,
  format: true,
  status: true,
  conversion: true,
  conversionError: true,
  isDefault: true,
  source: true,
  license: true,
  originalName: true,
  originalUrl: true,
  createdById: true,
  reviewNote: true,
  createdAt: true,
  createdBy: { select: { displayName: true } },
} as const;

type ScoreRow = {
  id: string;
  tuneId: string;
  label: string;
  kind: ScoreKind;
  format: string | null;
  status: ReviewStatus;
  conversion: string;
  conversionError: string | null;
  isDefault: boolean;
  source: string | null;
  license: string | null;
  originalName: string | null;
  originalUrl: string | null;
  createdById: string | null;
  reviewNote: string | null;
  createdAt: Date;
  createdBy: { displayName: string } | null;
};

const toView = (s: ScoreRow): ScoreView => ({
  ...s,
  createdBy: s.createdBy?.displayName ?? null,
  createdAt: s.createdAt.toISOString(),
});

/** Who may see a score: everyone once published; its author and admins before. */
export function canSeeScore(score: { status: ReviewStatus; createdById: string | null }, user: AppUser | null): boolean {
  if (score.status === "PUBLISHED") return true;
  if (!user) return false;
  return user.role === "ADMIN" || (canContribute(user) && score.createdById === user.id);
}

export async function listTunes(q = "", take = 200) {
  if (!prisma) return [];
  const rows = await prisma.tune.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    take,
    include: {
      _count: { select: { songs: true, scores: true } },
      scores: { where: { status: "PUBLISHED" }, select: { id: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    key: t.key,
    timeSignature: t.timeSignature,
    metre: t.metre,
    songs: t._count.songs,
    scores: t._count.scores,
    published: t.scores.length,
  }));
}

export async function getTune(id: string, user: AppUser | null) {
  if (!prisma) return null;
  const t = await prisma.tune.findUnique({
    where: { id },
    include: {
      songs: { select: { id: true, index: true, title: true, tune: true }, orderBy: { index: "asc" } },
      scores: { select: scoreSelect, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!t) return null;
  return { ...t, scores: t.scores.filter((s) => canSeeScore(s, user)).map(toView) };
}

export type TuneInput = {
  name: string;
  key?: string | null;
  timeSignature?: string | null;
  metre?: string | null;
  composer?: string | null;
  source?: string | null;
  license?: string | null;
  notes?: string | null;
};

export async function createTune(input: TuneInput, user: AppUser, songIds: string[] = []) {
  if (!prisma) throw new Error("Database unavailable");
  const tune = await prisma.tune.create({ data: { ...input, createdById: user.id } });
  if (songIds.length) await linkSongs(tune.id, songIds);
  return tune;
}

export async function updateTune(id: string, input: Partial<TuneInput>) {
  if (!prisma) throw new Error("Database unavailable");
  return prisma.tune.update({ where: { id }, data: input });
}

export async function linkSongs(tuneId: string, songIds: string[]) {
  if (!prisma) throw new Error("Database unavailable");
  await prisma.song.updateMany({ where: { id: { in: songIds } }, data: { tuneId } });
}

export async function unlinkSong(songId: string) {
  if (!prisma) throw new Error("Database unavailable");
  await prisma.song.update({ where: { id: songId }, data: { tuneId: null } });
}

export type NewScore = {
  tuneId: string;
  label: string;
  kind: ScoreKind;
  fileName: string;
  bytes: Uint8Array;
  source?: string | null;
  license?: string | null;
};

const SAFE_NAME = (n: string) => n.replace(/[^\w.\-]+/g, "_").slice(-80) || "score";

/** Store an uploaded score. Formats the player cannot read are queued for conversion on the server. */
export async function createScore(input: NewScore, user: AppUser): Promise<{ score: ScoreView; meta: ScoreMeta }> {
  if (!prisma) throw new Error("Database unavailable");
  if (!hasSaStorage()) throw new Error("STORAGE_NOT_CONFIGURED");
  const prepared = prepareScore(input.fileName, input.bytes);
  const id = crypto.randomUUID();
  const base = `scores/${input.tuneId}/${id}`;
  const originalExt = (input.fileName.toLowerCase().match(/\.[a-z0-9]{1,8}$/)?.[0] ?? `.${prepared.kind}`).slice(1);

  const original = await uploadFile(`${base}/original-${SAFE_NAME(input.fileName.replace(/\.[^.]+$/, ""))}.${originalExt}`, input.bytes);
  let fileKey: string | null = null;
  let meta: ScoreMeta = {};
  if (!prepared.needsConversion) {
    const stored = await uploadFile(`${base}/score.${extensionFor(prepared.format)}`, prepared.content, contentTypeFor(prepared.format));
    fileKey = stored.key;
    meta = readScoreMeta(prepared.content, prepared.format);
  }

  const created = await prisma.scoreFile.create({
    data: {
      id,
      tuneId: input.tuneId,
      label: input.label,
      kind: input.kind,
      format: prepared.format,
      fileKey,
      fileUrl: fileKey ? publicFileUrl(fileKey) : null,
      originalKey: original.key,
      originalUrl: publicFileUrl(original.key),
      originalName: input.fileName.slice(0, 200),
      originalFormat: prepared.kind,
      conversion: prepared.needsConversion ? "PENDING" : "READY",
      status: "DRAFT",
      source: input.source || null,
      license: input.license || null,
      createdById: user.id,
    },
    select: scoreSelect,
  });
  if (prepared.needsConversion) await enqueueJob("score.convert", { id });

  // Fill the tune's empty fields from the score (key, time signature, composer).
  const tune = await prisma.tune.findUnique({ where: { id: input.tuneId } });
  if (tune) {
    const patch: Partial<TuneInput> = {};
    if (!tune.key && meta.key) patch.key = meta.key;
    if (!tune.timeSignature && meta.timeSignature) patch.timeSignature = meta.timeSignature;
    if (!tune.composer && meta.composer) patch.composer = meta.composer;
    if (Object.keys(patch).length) await prisma.tune.update({ where: { id: tune.id }, data: patch });
  }
  return { score: toView(created), meta };
}

export async function reviewScore(id: string, action: "publish" | "reject" | "unpublish", admin: AppUser, note?: string) {
  if (!prisma) throw new Error("Database unavailable");
  const score = await prisma.scoreFile.findUnique({ where: { id } });
  if (!score) throw new Error("NOT_FOUND");
  if (action === "publish" && score.conversion !== "READY") throw new Error("NOT_CONVERTED");
  const status: ReviewStatus = action === "publish" ? "PUBLISHED" : action === "reject" ? "REJECTED" : "DRAFT";
  const updated = await prisma.scoreFile.update({
    where: { id },
    data: { status, reviewedById: admin.id, reviewedAt: new Date(), reviewNote: note?.slice(0, 1000) || null },
    select: scoreSelect,
  });
  // The first published score of a tune becomes its default.
  if (status === "PUBLISHED") {
    const hasDefault = await prisma.scoreFile.count({ where: { tuneId: score.tuneId, isDefault: true, status: "PUBLISHED" } });
    if (!hasDefault) await setDefaultScore(id);
  }
  return toView(updated);
}

export async function updateScore(id: string, data: { label?: string; kind?: ScoreKind; source?: string | null; license?: string | null }) {
  if (!prisma) throw new Error("Database unavailable");
  return toView(await prisma.scoreFile.update({ where: { id }, data, select: scoreSelect }));
}

export async function setDefaultScore(id: string) {
  if (!prisma) throw new Error("Database unavailable");
  const score = await prisma.scoreFile.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.scoreFile.updateMany({ where: { tuneId: score.tuneId }, data: { isDefault: false } }),
    prisma.scoreFile.update({ where: { id }, data: { isDefault: true } }),
  ]);
}

export async function retryConversion(id: string) {
  if (!prisma) throw new Error("Database unavailable");
  await prisma.scoreFile.update({ where: { id }, data: { conversion: "PENDING", conversionError: null } });
  await enqueueJob("score.convert", { id });
}

/** Scores shown with a hymn: published ones of its tune (plus the viewer's own drafts / all for admins). */
export async function getSongScores(songId: string, user: AppUser | null) {
  if (!prisma) return { tune: null, scores: [] as ScoreView[] };
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      tuneRef: {
        select: {
          id: true,
          name: true,
          key: true,
          timeSignature: true,
          metre: true,
          composer: true,
          source: true,
          license: true,
          scores: { select: scoreSelect, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        },
      },
    },
  });
  const tune = song?.tuneRef;
  if (!tune) return { tune: null, scores: [] as ScoreView[] };
  const scores = tune.scores.filter((s) => s.conversion === "READY" && s.status !== "REJECTED" && canSeeScore(s, user)).map(toView);
  const { scores: _all, ...tuneInfo } = tune;
  void _all;
  return { tune: tuneInfo, scores };
}

/** The file the player renders (text), if this viewer may see it. */
export async function getScoreForPlayer(id: string, user: AppUser | null) {
  if (!prisma) return null;
  const s = await prisma.scoreFile.findUnique({ where: { id } });
  if (!s || !s.fileKey || !s.format || !canSeeScore(s, user)) return null;
  return { format: s.format, fileKey: s.fileKey, status: s.status, updatedAt: s.updatedAt };
}

/** Drafts waiting for an admin. */
export async function getScoreQueue() {
  if (!prisma) return [];
  const rows = await prisma.scoreFile.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
    select: { ...scoreSelect, tune: { select: { id: true, name: true, songs: { select: { index: true }, take: 5, orderBy: { index: "asc" } } } } },
  });
  return rows.map((r) => ({ ...toView(r), tune: { id: r.tune.id, name: r.tune.name, songs: r.tune.songs.map((s) => s.index) } }));
}

export async function getMyScores(user: AppUser) {
  if (!prisma) return [];
  const rows = await prisma.scoreFile.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { ...scoreSelect, tune: { select: { id: true, name: true } } },
  });
  return rows.map((r) => ({ ...toView(r), tune: r.tune }));
}

/** Audio from a score, made on the server: an instrument rendering, or (experimental) an AI voice. */
export async function queueScoreAudio(id: string, kind: "render" | "sing", user: AppUser, instrument: "organ" | "piano" | "choir" = "organ") {
  if (!prisma) throw new Error("Database unavailable");
  const score = await prisma.scoreFile.findUnique({ where: { id }, select: { conversion: true, tune: { select: { _count: { select: { songs: true } } } } } });
  if (!score) throw new Error("NOT_FOUND");
  if (score.conversion !== "READY") throw new Error("NOT_CONVERTED");
  if (!score.tune._count.songs) throw new Error("NO_SONGS");
  if (kind === "render") await enqueueJob("recording.render", { scoreId: id, instrument, userId: user.id });
  else await enqueueJob("recording.sing", { scoreId: id, userId: user.id });
}
