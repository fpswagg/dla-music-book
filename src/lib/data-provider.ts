import "server-only";
import type { Author, Prisma } from "@/generated/prisma/client";
import { CollectionStatus, SongStatus } from "@/generated/prisma/client";
import { isMockMode } from "./config";
import { prisma } from "./prisma";
import { searchTokens } from "./duala";
import { firstLine, getLyricsContent, type LyricsContent } from "./lyrics";
import {
  getMockSongs,
  getMockSongById,
  getMockAuthors,
  getMockTags,
  getMockLanguages,
  getMockCollections,
  getMockUsers,
  getMockUserLikedSongIds,
  getMockUserLikedSongs,
  getMockUserCollections,
  getMockCollectionByIdMerged,
  type MockSong,
} from "./mock/provider";

type I18nName = string | Record<string, string>;

export type SongReferenceView = { hymnalId: string; code: string; name: string; number: string };

export type SongVersionView = {
  id: string;
  versionType: string;
  versionNumber: number;
  lyrics: string;
  content: LyricsContent;
  annotations: Array<{ id: string; lineNumber: number; lineText: string; note: string }>;
  previews: Array<{ id: string; fileUrl: string; durationSeconds: number }>;
};

export type SongWithRelations = {
  id: string;
  index: number;
  title: string;
  status: string;
  page: number | null;
  tune: string | null;
  createdAt: string;
  updatedAt: string;
  authors: Array<{ id: string; name: string; displayOrder: number }>;
  tags: Array<{ id: string; key?: string; name: I18nName; category?: string }>;
  languages: Array<{ id: string; code: string; name: I18nName }>;
  references: SongReferenceView[];
  versions: SongVersionView[];
  notes: Array<{ id: string; content: string }>;
  _count?: { likes: number };
};

/** Lightweight row for lists, the number pad and offline use. */
export type SongSummary = { id: string; index: number; title: string; firstLine: string; page: number | null };

const songInclude = {
  songAuthors: { include: { author: true }, orderBy: { displayOrder: "asc" } },
  songTags: { include: { tag: true } },
  songLanguages: { include: { language: true } },
  references: { include: { hymnal: true }, orderBy: { displayOrder: "asc" } },
  versions: { include: { annotations: true, previews: true }, orderBy: { versionNumber: "desc" } },
  notes: { orderBy: { createdAt: "desc" } },
  _count: { select: { likes: true } },
} satisfies Prisma.SongInclude;

type SongRow = Prisma.SongGetPayload<{ include: typeof songInclude }>;

function mapSong(s: SongRow): SongWithRelations {
  return {
    id: s.id,
    index: s.index,
    title: s.title,
    status: s.status,
    page: s.page,
    tune: s.tune,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    authors: s.songAuthors.map((sa) => ({ id: sa.author.id, name: sa.author.name, displayOrder: sa.displayOrder })),
    tags: s.songTags.map((st) => ({
      id: st.tag.id,
      key: st.tag.key,
      name: st.tag.name as I18nName,
      category: st.tag.category,
    })),
    languages: s.songLanguages.map((sl) => ({ id: sl.language.id, code: sl.language.code, name: sl.language.name as I18nName })),
    references: s.references.map((r) => ({ hymnalId: r.hymnalId, code: r.hymnal.code, name: r.hymnal.name, number: r.number })),
    versions: s.versions.map((v) => ({
      id: v.id,
      versionType: v.versionType,
      versionNumber: v.versionNumber,
      lyrics: v.lyrics,
      content: getLyricsContent(v),
      annotations: v.annotations.map((a) => ({ id: a.id, lineNumber: a.lineNumber, lineText: a.lineText, note: a.note })),
      previews: v.previews.map((p) => ({ id: p.id, fileUrl: p.fileUrl, durationSeconds: p.durationSeconds })),
    })),
    notes: s.notes.map((n) => ({ id: n.id, content: n.content })),
    _count: s._count,
  };
}

function mockToSong(m: MockSong): SongWithRelations {
  return {
    id: m.id,
    index: m.index,
    title: m.title,
    status: m.status,
    page: null,
    tune: null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    authors: m.authors.map((a) => ({ id: a.id, name: a.name, displayOrder: a.displayOrder })),
    tags: m.tags.map((t) => ({ id: t.id, key: t.key, name: t.name, category: t.category })),
    languages: m.languages.map((l) => ({ id: l.id, code: l.code, name: l.name })),
    references: [],
    versions: m.versions.map((v) => ({
      id: v.id,
      versionType: v.versionType,
      versionNumber: v.versionNumber,
      lyrics: v.lyrics,
      content: getLyricsContent({ lyrics: v.lyrics }),
      annotations: v.annotations.map((a) => ({ id: a.id, lineNumber: a.lineNumber, lineText: a.lineText, note: a.note })),
      previews: [],
    })),
    notes: m.notes.map((n) => ({ id: n.id, content: n.content })),
    _count: { likes: 0 },
  };
}

/** Diacritic-insensitive search: every word must appear (title, lyrics, references, authors). */
function songSearchWhere(q: string): Prisma.SongWhereInput {
  const tokens = searchTokens(q);
  const or: Prisma.SongWhereInput[] = [
    { title: { contains: q, mode: "insensitive" } },
    { versions: { some: { lyrics: { contains: q, mode: "insensitive" } } } },
    { songAuthors: { some: { author: { name: { contains: q, mode: "insensitive" } } } } },
  ];
  if (tokens.length) or.unshift({ AND: tokens.map((t) => ({ searchText: { contains: t } })) });
  const n = Number(q.trim().replace(/^(?:n[°o]|#)\s*/i, ""));
  if (Number.isInteger(n) && n > 0) or.unshift({ index: n });
  return { OR: or };
}

export async function getSongs(filters?: {
  q?: string;
  status?: string;
  language?: string;
  mood?: string;
  tag?: string;
  author?: string;
  hymnal?: string;
  page?: number;
  limit?: number;
}): Promise<{ songs: SongWithRelations[]; total: number }> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;

  if (isMockMode()) {
    const all = getMockSongs({ ...filters, tag: filters?.tag ?? filters?.mood });
    const start = (page - 1) * limit;
    return { songs: all.slice(start, start + limit).map(mockToSong), total: all.length };
  }
  if (!prisma) return { songs: [], total: 0 };

  const and: Prisma.SongWhereInput[] = [];
  if (filters?.status) and.push({ status: filters.status as SongStatus });
  if (filters?.language) and.push({ songLanguages: { some: { language: { code: filters.language } } } });
  const tagKey = filters?.tag ?? filters?.mood;
  if (tagKey) and.push({ songTags: { some: { tag: { key: tagKey } } } });
  if (filters?.author) {
    and.push({ songAuthors: { some: { author: { name: { contains: filters.author, mode: "insensitive" } } } } });
  }
  if (filters?.hymnal) and.push({ references: { some: { hymnal: { code: filters.hymnal } } } });
  if (filters?.q?.trim()) and.push(songSearchWhere(filters.q.trim()));
  const where: Prisma.SongWhereInput = and.length ? { AND: and } : {};

  const [songs, total] = await Promise.all([
    prisma.song.findMany({ where, include: songInclude, orderBy: { index: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.song.count({ where }),
  ]);
  return { songs: songs.map(mapSong), total };
}

export async function getSongById(id: string): Promise<SongWithRelations | null> {
  if (isMockMode()) {
    const m = getMockSongById(id);
    return m ? mockToSong(m) : null;
  }
  if (!prisma) return null;
  const song = await prisma.song.findUnique({ where: { id }, include: songInclude });
  return song ? mapSong(song) : null;
}

export async function getSongByIndex(index: number): Promise<SongWithRelations | null> {
  if (!Number.isInteger(index) || index < 1) return null;
  if (isMockMode()) {
    const m = getMockSongs().find((s) => s.index === index);
    return m ? mockToSong(m) : null;
  }
  if (!prisma) return null;
  const song = await prisma.song.findUnique({ where: { index }, include: songInclude });
  return song ? mapSong(song) : null;
}

/** "/songs/42" (hymn number) or "/songs/<uuid>" (older links). */
export async function getSongByParam(param: string): Promise<SongWithRelations | null> {
  return /^\d{1,5}$/.test(param) ? getSongByIndex(Number(param)) : getSongById(param);
}

/** Previous / next published hymn, for page turning. */
export async function getAdjacentSongs(index: number): Promise<{ prev: number | null; next: number | null }> {
  if (isMockMode()) {
    const nums = getMockSongs({ status: "FINISHED" }).map((s) => s.index).sort((a, b) => a - b);
    return { prev: [...nums].reverse().find((n) => n < index) ?? null, next: nums.find((n) => n > index) ?? null };
  }
  if (!prisma) return { prev: null, next: null };
  const [prev, next] = await Promise.all([
    prisma.song.findFirst({ where: { status: "FINISHED", index: { lt: index } }, orderBy: { index: "desc" }, select: { index: true } }),
    prisma.song.findFirst({ where: { status: "FINISHED", index: { gt: index } }, orderBy: { index: "asc" }, select: { index: true } }),
  ]);
  return { prev: prev?.index ?? null, next: next?.index ?? null };
}

/** Every published hymn, light: for the number pad, sitemap and printing ranges. */
export async function getSongSummaries(): Promise<SongSummary[]> {
  if (isMockMode()) {
    return getMockSongs({ status: "FINISHED" }).map((m) => {
      const c = getLyricsContent({ lyrics: m.versions[0]?.lyrics ?? "" });
      return { id: m.id, index: m.index, title: m.title, firstLine: firstLine(c), page: null };
    });
  }
  if (!prisma) return [];
  const rows = await prisma.song.findMany({
    where: { status: "FINISHED" },
    orderBy: { index: "asc" },
    select: {
      id: true,
      index: true,
      title: true,
      page: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { content: true, lyrics: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    index: r.index,
    title: r.title,
    page: r.page,
    firstLine: r.versions[0] ? firstLine(getLyricsContent(r.versions[0])) : "",
  }));
}

/** Published hymns with lyrics, for offline reading and printing. */
export async function getPublishedSongs(range?: { from?: number; to?: number }): Promise<SongWithRelations[]> {
  if (isMockMode()) {
    return getMockSongs({ status: "FINISHED" })
      .filter((m) => (range?.from ? m.index >= range.from : true) && (range?.to ? m.index <= range.to : true))
      .map(mockToSong);
  }
  if (!prisma) return [];
  const rows = await prisma.song.findMany({
    where: { status: "FINISHED", index: { gte: range?.from, lte: range?.to } },
    include: songInclude,
    orderBy: { index: "asc" },
  });
  return rows.map(mapSong);
}

export type HymnalView = { id: string; code: string; name: string; description: string | null; aliases: string[]; sortOrder: number; songCount: number };

export async function getHymnals(): Promise<HymnalView[]> {
  if (isMockMode() || !prisma) return [];
  const rows = await prisma.hymnal.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: { _count: { select: { references: true } } },
  });
  return rows.map((h) => ({
    id: h.id,
    code: h.code,
    name: h.name,
    description: h.description,
    aliases: h.aliases,
    sortOrder: h.sortOrder,
    songCount: h._count.references,
  }));
}

export async function getAuthors() {
  if (isMockMode()) return getMockAuthors();
  if (!prisma) return [];
  return prisma.author.findMany({ orderBy: { name: "asc" } });
}

export async function getAdminAuthorsList(options?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ authors: Author[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const q = options?.q?.trim() ?? "";
  const skip = (page - 1) * limit;

  if (isMockMode()) {
    let list = getMockAuthors();
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(ql) ||
          (a.bio && a.bio.toLowerCase().includes(ql)),
      );
    }
    return { authors: list.slice(skip, skip + limit), total: list.length };
  }
  if (!prisma) return { authors: [], total: 0 };

  const where: Prisma.AuthorWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.author.count({ where }),
  ]);
  return { authors, total };
}

type TagResult = { id: string; key: string; name: string | Record<string, string>; category: string };
type LanguageResult = { id: string; code: string; name: string | Record<string, string> };
type CollectionResult = {
  id: string;
  name: string | Record<string, string>;
  description?: string | Record<string, string> | null;
  status: string;
  isPublic: boolean;
  _count: { collectionSongs: number };
  user?: { displayName: string };
};

function jsonRecordIncludes(obj: unknown, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.values(obj as Record<string, unknown>).some(
      (v) => typeof v === "string" && v.toLowerCase().includes(needle),
    );
  }
  return false;
}

function mapCollectionRow(c: {
  id: string;
  name: unknown;
  description: unknown;
  status: string;
  isPublic: boolean;
  _count: { collectionSongs: number };
  user?: { displayName: string } | null;
}): CollectionResult {
  return {
    id: c.id,
    name: c.name as string | Record<string, string>,
    description: c.description as string | Record<string, string> | null,
    status: c.status,
    isPublic: c.isPublic,
    _count: c._count,
    user: c.user ?? undefined,
  };
}

export async function getTags(): Promise<TagResult[]> {
  if (isMockMode()) return getMockTags();
  if (!prisma) return [];
  const tags = await prisma.tag.findMany({ orderBy: { category: "asc" } });
  return tags.map((t) => ({ id: t.id, key: t.key, name: t.name as string | Record<string, string>, category: t.category }));
}

export async function getAdminTagsList(options?: {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ tags: TagResult[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 24;
  const q = options?.q?.trim().toLowerCase() ?? "";
  const category = options?.category;
  const skip = (page - 1) * limit;

  if (isMockMode()) {
    let list = getMockTags().map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name as string | Record<string, string>,
      category: t.category,
    }));
    if (category) list = list.filter((t) => t.category === category);
    if (q) {
      list = list.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          JSON.stringify(t.name).toLowerCase().includes(q),
      );
    }
    return { tags: list.slice(skip, skip + limit), total: list.length };
  }
  if (!prisma) return { tags: [], total: 0 };

  const where: Prisma.TagWhereInput = {};
  if (category) where.category = category as Prisma.TagWhereInput["category"];

  const all = await prisma.tag.findMany({
    where,
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  const mapped = all.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name as string | Record<string, string>,
    category: t.category,
  }));
  let list = mapped;
  if (q) {
    list = mapped.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        JSON.stringify(t.name).toLowerCase().includes(q),
    );
  }
  return {
    tags: list.slice(skip, skip + limit),
    total: list.length,
  };
}

export async function getLanguages(): Promise<LanguageResult[]> {
  if (isMockMode()) return getMockLanguages();
  if (!prisma) return [];
  const langs = await prisma.language.findMany({ orderBy: { code: "asc" } });
  return langs.map((l) => ({ id: l.id, code: l.code, name: l.name as string | Record<string, string> }));
}

export async function getPublicCollections(options?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ collections: CollectionResult[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const q = options?.q?.trim() ?? "";
  const skip = (page - 1) * limit;

  if (isMockMode()) {
    let list = getMockCollections(true).map((c) =>
      mapCollectionRow({
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        status: c.status,
        isPublic: c.isPublic,
        _count: { collectionSongs: c.songs.length },
        user: { displayName: "Admin" },
      }),
    );
    if (q) {
      list = list.filter(
        (c) =>
          jsonRecordIncludes(c.name, q) ||
          (c.description != null && jsonRecordIncludes(c.description, q)),
      );
    }
    const total = list.length;
    const collections = list.slice(skip, skip + limit);
    return { collections, total };
  }
  if (!prisma) return { collections: [], total: 0 };

  if (!q) {
    const [cols, total] = await Promise.all([
      prisma.collection.findMany({
        where: { status: "PUBLIC" },
        include: {
          user: { select: { displayName: true } },
          _count: { select: { collectionSongs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.collection.count({ where: { status: "PUBLIC" } }),
    ]);
    return {
      collections: cols.map((c) => mapCollectionRow(c)),
      total,
    };
  }

  const all = await prisma.collection.findMany({
    where: { status: "PUBLIC" },
    include: {
      user: { select: { displayName: true } },
      _count: { select: { collectionSongs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const filtered = all.filter(
    (c) =>
      jsonRecordIncludes(c.name, q) ||
      (c.description != null && jsonRecordIncludes(c.description, q)),
  );
  const total = filtered.length;
  const collections = filtered
    .slice(skip, skip + limit)
    .map((c) => mapCollectionRow(c));
  return { collections, total };
}

export async function getUserLikedSongIds(
  userId: string,
  songIds: string[],
): Promise<Record<string, boolean>> {
  if (songIds.length === 0) return {};
  if (isMockMode()) return getMockUserLikedSongIds(userId, songIds);
  if (!prisma) return Object.fromEntries(songIds.map((id) => [id, false]));
  const likes = await prisma.like.findMany({
    where: { userId, songId: { in: songIds } },
    select: { songId: true },
  });
  const set = new Set(likes.map((l) => l.songId));
  return Object.fromEntries(songIds.map((id) => [id, set.has(id)]));
}

export async function getUserLikedSongs(userId: string): Promise<SongWithRelations[]> {
  if (isMockMode()) return getMockUserLikedSongs(userId).map(mockToSong);
  if (!prisma) return [];
  const likes = await prisma.like.findMany({
    where: { userId, song: { status: "FINISHED" } },
    orderBy: { createdAt: "desc" },
    include: { song: { include: songInclude } },
  });
  return likes.map((l) => mapSong(l.song));
}

export async function getCollectionSongSummaries(
  collectionId: string,
  userId: string,
): Promise<Array<{ id: string; title: string; index: number }>> {
  if (isMockMode()) {
    const c = getMockCollectionByIdMerged(collectionId);
    if (!c || c.userId !== userId) return [];
    return c.songs
      .map((sid) => {
        const s = getMockSongById(sid);
        return s ? { id: s.id, title: s.title, index: s.index } : null;
      })
      .filter((x): x is { id: string; title: string; index: number } => !!x);
  }
  if (!prisma) return [];
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });
  if (!col) return [];
  const rows = await prisma.collectionSong.findMany({
    where: { collectionId },
    include: { song: { select: { id: true, title: true, index: true } } },
    orderBy: { displayOrder: "asc" },
  });
  return rows.map((r) => ({
    id: r.song.id,
    title: r.song.title,
    index: r.song.index,
  }));
}

export async function getUserCollections(userId: string): Promise<CollectionResult[]> {
  if (isMockMode()) {
    const mockUser = getMockUsers().find((u) => u.id === userId);
    return getMockUserCollections(userId).map((c) => ({
      id: c.id,
      name: c.name as string | Record<string, string>,
      description: c.description as string | Record<string, string> | null,
      status: c.status,
      isPublic: c.isPublic,
      _count: { collectionSongs: c.songs.length },
      user: { displayName: mockUser?.displayName ?? "User" },
    }));
  }
  if (!prisma) return [];
  const cols = await prisma.collection.findMany({
    where: { userId },
    include: {
      user: { select: { displayName: true } },
      _count: { select: { collectionSongs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return cols.map((c) => ({
    id: c.id,
    name: c.name as string | Record<string, string>,
    description: c.description as string | Record<string, string> | null,
    status: c.status,
    isPublic: c.isPublic,
    _count: c._count,
    user: c.user,
  }));
}

export async function getAdminCollectionsList(options?: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ collections: CollectionResult[]; total: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const q = options?.q?.trim() ?? "";
  const statusFilter = options?.status?.trim();
  const skip = (page - 1) * limit;

  if (isMockMode()) {
    let list = getMockCollections().map((c) =>
      mapCollectionRow({
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        status: c.status,
        isPublic: c.isPublic,
        _count: { collectionSongs: c.songs.length },
        user: { displayName: "Admin" },
      }),
    );
    if (statusFilter && ["PRIVATE", "PUBLIC", "PENDING_REVIEW"].includes(statusFilter)) {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (q) {
      list = list.filter(
        (c) =>
          jsonRecordIncludes(c.name, q) ||
          (c.description != null && jsonRecordIncludes(c.description, q)),
      );
    }
    const total = list.length;
    return { collections: list.slice(skip, skip + limit), total };
  }
  if (!prisma) return { collections: [], total: 0 };

  const where: Prisma.CollectionWhereInput = {};
  if (statusFilter && ["PRIVATE", "PUBLIC", "PENDING_REVIEW"].includes(statusFilter)) {
    where.status = statusFilter as CollectionStatus;
  }

  if (!q) {
    const [cols, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: {
          user: { select: { displayName: true } },
          _count: { select: { collectionSongs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.collection.count({ where }),
    ]);
    return { collections: cols.map((c) => mapCollectionRow(c)), total };
  }

  const all = await prisma.collection.findMany({
    where,
    include: {
      user: { select: { displayName: true } },
      _count: { select: { collectionSongs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const filtered = all.filter(
    (c) =>
      jsonRecordIncludes(c.name, q) ||
      (c.description != null && jsonRecordIncludes(c.description, q)),
  );
  const total = filtered.length;
  const collections = filtered
    .slice(skip, skip + limit)
    .map((c) => mapCollectionRow(c));
  return { collections, total };
}

export async function getStats() {
  if (isMockMode()) {
    const songs = getMockSongs();
    return {
      totalSongs: songs.length,
      finishedSongs: songs.filter((s) => s.status === "FINISHED").length,
      draftSongs: songs.filter((s) => s.status === "DRAFT").length,
      totalUsers: getMockUsers().length,
      totalCollections: getMockCollections().length,
    };
  }
  if (!prisma) return { totalSongs: 0, finishedSongs: 0, draftSongs: 0, totalUsers: 0, totalCollections: 0 };

  const [totalSongs, finishedSongs, draftSongs, totalUsers, totalCollections] = await Promise.all([
    prisma.song.count(),
    prisma.song.count({ where: { status: "FINISHED" } }),
    prisma.song.count({ where: { status: "DRAFT" } }),
    prisma.user.count(),
    prisma.collection.count({ where: { status: "PUBLIC" } }),
  ]);

  return { totalSongs, finishedSongs, draftSongs, totalUsers, totalCollections };
}
