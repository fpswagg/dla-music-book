import type { Prisma } from "@prisma/client";
import { SongStatus } from "@prisma/client";
import { isMockMode } from "./env";
import { prisma } from "./prisma";
import {
  getMockSongs,
  getMockSongById,
  getMockAuthors,
  getMockTags,
  getMockLanguages,
  getMockCollections,
  getMockUsers,
  type MockSong,
} from "./mock/provider";

export type SongWithRelations = {
  id: string;
  index: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authors: Array<{ id: string; name: string; displayOrder: number }>;
  tags: Array<{ id: string; name: string; category?: string }>;
  languages: Array<{ id: string; code: string; name: string }>;
  versions: Array<{
    id: string;
    versionType: string;
    versionNumber: number;
    lyrics: string;
    annotations: Array<{
      id: string;
      lineNumber: number;
      lineText: string;
      note: string;
    }>;
  }>;
  notes: Array<{ id: string; content: string }>;
  _count?: { likes: number };
};

function mockToSong(m: MockSong): SongWithRelations {
  return {
    id: m.id,
    index: m.index,
    title: m.title,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    authors: m.authors.map((a) => ({ id: a.id, name: a.name, displayOrder: a.displayOrder })),
    tags: m.tags.map((t) => ({ id: t.id, name: t.name })),
    languages: m.languages.map((l) => ({ id: l.id, code: l.code, name: l.name })),
    versions: m.versions.map((v) => ({
      id: v.id,
      versionType: v.versionType,
      versionNumber: v.versionNumber,
      lyrics: v.lyrics,
      annotations: v.annotations.map((a) => ({
        id: a.id,
        lineNumber: a.lineNumber,
        lineText: a.lineText,
        note: a.note,
      })),
    })),
    notes: m.notes.map((n) => ({ id: n.id, content: n.content })),
    _count: { likes: 0 },
  };
}

export async function getSongs(filters?: {
  q?: string;
  status?: string;
  language?: string;
  mood?: string;
  author?: string;
  page?: number;
  limit?: number;
}): Promise<{ songs: SongWithRelations[]; total: number }> {
  if (isMockMode()) {
    const all = getMockSongs(filters);
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      songs: all.slice(start, start + limit).map(mockToSong),
      total: all.length,
    };
  }

  if (!prisma) return { songs: [], total: 0 };

  const where: Prisma.SongWhereInput = {};
  if (filters?.status) where.status = filters.status as SongStatus;
  if (filters?.language) {
    where.songLanguages = { some: { language: { code: filters.language } } };
  }
  if (filters?.mood) {
    where.songTags = { some: { tag: { name: filters.mood } } };
  }
  if (filters?.author) {
    where.songAuthors = { some: { author: { name: { contains: filters.author, mode: "insensitive" } } } };
  }
  if (filters?.q) {
    const q = filters.q;
    const or: Prisma.SongWhereInput[] = [
      { title: { contains: q, mode: "insensitive" } },
      { songAuthors: { some: { author: { name: { contains: q, mode: "insensitive" } } } } },
      { versions: { some: { lyrics: { contains: q, mode: "insensitive" } } } },
    ];
    if (!isNaN(Number(q))) {
      or.push({ index: Number(q) });
    }
    where.OR = or;
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: {
        songAuthors: { include: { author: true }, orderBy: { displayOrder: "asc" } },
        songTags: { include: { tag: true } },
        songLanguages: { include: { language: true } },
        versions: {
          include: { annotations: true },
          orderBy: { versionNumber: "desc" },
        },
        notes: { orderBy: { createdAt: "desc" } },
        _count: { select: { likes: true } },
      },
      orderBy: { index: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.song.count({ where }),
  ]);

  return {
    songs: songs.map((s) => ({
      id: s.id,
      index: s.index,
      title: s.title,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      authors: s.songAuthors.map((sa) => ({
        id: sa.author.id,
        name: sa.author.name,
        displayOrder: sa.displayOrder,
      })),
      tags: s.songTags.map((st) => ({
        id: st.tag.id,
        name: st.tag.name,
        category: st.tag.category,
      })),
      languages: s.songLanguages.map((sl) => ({
        id: sl.language.id,
        code: sl.language.code,
        name: sl.language.name,
      })),
      versions: s.versions.map((v) => ({
        id: v.id,
        versionType: v.versionType,
        versionNumber: v.versionNumber,
        lyrics: v.lyrics,
        annotations: v.annotations.map((a) => ({
          id: a.id,
          lineNumber: a.lineNumber,
          lineText: a.lineText,
          note: a.note,
        })),
      })),
      notes: s.notes.map((n) => ({ id: n.id, content: n.content })),
      _count: s._count,
    })),
    total,
  };
}

export async function getSongById(id: string): Promise<SongWithRelations | null> {
  if (isMockMode()) {
    const m = getMockSongById(id);
    return m ? mockToSong(m) : null;
  }

  if (!prisma) return null;

  const song = await prisma.song.findUnique({
    where: { id },
    include: {
      songAuthors: { include: { author: true }, orderBy: { displayOrder: "asc" } },
      songTags: { include: { tag: true } },
      songLanguages: { include: { language: true } },
      versions: {
        include: { annotations: true, previews: true },
        orderBy: { versionNumber: "desc" },
      },
      notes: { orderBy: { createdAt: "desc" } },
      _count: { select: { likes: true } },
    },
  });

  if (!song) return null;

  return {
    id: song.id,
    index: song.index,
    title: song.title,
    status: song.status,
    createdAt: song.createdAt.toISOString(),
    updatedAt: song.updatedAt.toISOString(),
    authors: song.songAuthors.map((sa) => ({
      id: sa.author.id,
      name: sa.author.name,
      displayOrder: sa.displayOrder,
    })),
    tags: song.songTags.map((st) => ({
      id: st.tag.id,
      name: st.tag.name,
      category: st.tag.category,
    })),
    languages: song.songLanguages.map((sl) => ({
      id: sl.language.id,
      code: sl.language.code,
      name: sl.language.name,
    })),
    versions: song.versions.map((v) => ({
      id: v.id,
      versionType: v.versionType,
      versionNumber: v.versionNumber,
      lyrics: v.lyrics,
      annotations: v.annotations.map((a) => ({
        id: a.id,
        lineNumber: a.lineNumber,
        lineText: a.lineText,
        note: a.note,
      })),
    })),
    notes: song.notes.map((n) => ({ id: n.id, content: n.content })),
    _count: song._count,
  };
}

export async function getAuthors() {
  if (isMockMode()) return getMockAuthors();
  if (!prisma) return [];
  return prisma.author.findMany({ orderBy: { name: "asc" } });
}

export async function getTags() {
  if (isMockMode()) return getMockTags();
  if (!prisma) return [];
  return prisma.tag.findMany({ orderBy: { category: "asc" } });
}

export async function getLanguages() {
  if (isMockMode()) return getMockLanguages();
  if (!prisma) return [];
  return prisma.language.findMany({ orderBy: { name: "asc" } });
}

export async function getPublicCollections() {
  if (isMockMode()) {
    return getMockCollections(true).map((c) => ({
      ...c,
      _count: { collectionSongs: c.songs.length },
      user: { displayName: "Admin" },
    }));
  }
  if (!prisma) return [];
  return prisma.collection.findMany({
    where: { status: "PUBLIC", isPublic: true },
    include: {
      user: { select: { displayName: true } },
      _count: { select: { collectionSongs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
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
    prisma.userProfile.count(),
    prisma.collection.count({ where: { status: "PUBLIC" } }),
  ]);

  return { totalSongs, finishedSongs, draftSongs, totalUsers, totalCollections };
}
