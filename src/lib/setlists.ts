import "server-only";
import { isMockMode } from "./config";
import { prisma } from "./prisma";
import { getLyricsContent, stanzaNumbers, type LyricsContent } from "./lyrics";

export type SetlistSummary = { id: string; code: string; title: string; date: string | null; itemCount: number; updatedAt: string };

export type SetlistItemView = {
  id: string;
  label: string | null;
  stanzas: number[];
  note: string | null;
  song: null | {
    id: string;
    index: number;
    title: string;
    references: Array<{ code: string; number: string }>;
    content: LyricsContent;
    stanzaNumbers: number[];
  };
};

export type SetlistView = {
  id: string;
  code: string;
  title: string;
  date: string | null;
  notes: string | null;
  shared: boolean;
  ownerId: string;
  ownerName: string;
  items: SetlistItemView[];
};

// Demo mode keeps programmes in memory (lost on restart). On globalThis because Next bundles
// each route separately: a module-level Map would differ between the API and the pages.
const globalForMock = globalThis as unknown as { mockSetlists?: Map<string, SetlistView> };
const mockStore = (globalForMock.mockSetlists ??= new Map<string, SetlistView>());

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function newSetlistCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function listSetlists(userId: string): Promise<SetlistSummary[]> {
  if (isMockMode()) {
    return [...mockStore.values()]
      .filter((s) => s.ownerId === userId)
      .map((s) => ({ id: s.id, code: s.code, title: s.title, date: s.date, itemCount: s.items.length, updatedAt: new Date().toISOString() }));
  }
  if (!prisma) return [];
  const rows = await prisma.setlist.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { items: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    date: s.date ? s.date.toISOString().slice(0, 10) : null,
    itemCount: s._count.items,
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function getSetlist(where: { id: string } | { code: string }): Promise<SetlistView | null> {
  if (isMockMode()) {
    return [...mockStore.values()].find((s) => ("id" in where ? s.id === where.id : s.code === where.code)) ?? null;
  }
  if (!prisma) return null;
  const s = await prisma.setlist.findUnique({
    where,
    include: {
      user: { select: { displayName: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          song: {
            include: {
              references: { include: { hymnal: true }, orderBy: { displayOrder: "asc" } },
              versions: { orderBy: { versionNumber: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    code: s.code,
    title: s.title,
    date: s.date ? s.date.toISOString().slice(0, 10) : null,
    notes: s.notes,
    shared: s.shared,
    ownerId: s.userId,
    ownerName: s.user.displayName,
    items: s.items.map((it) => {
      const content = it.song?.versions[0] ? getLyricsContent(it.song.versions[0]) : null;
      return {
        id: it.id,
        label: it.label,
        stanzas: it.stanzas,
        note: it.note,
        song:
          it.song && content
            ? {
                id: it.song.id,
                index: it.song.index,
                title: it.song.title,
                references: it.song.references.map((r) => ({ code: r.hymnal.code, number: r.number })),
                content,
                stanzaNumbers: stanzaNumbers(content),
              }
            : null,
      };
    }),
  };
}

type ItemInput = { songId?: string | null; label?: string | null; stanzas?: number[]; note?: string | null };

export async function createSetlist(
  userId: string,
  data: { title: string; date?: string | null; notes?: string | null; shared?: boolean; items?: ItemInput[] },
): Promise<{ id: string; code: string }> {
  const code = newSetlistCode();
  if (isMockMode()) {
    const id = crypto.randomUUID();
    mockStore.set(id, {
      id,
      code,
      title: data.title,
      date: data.date ?? null,
      notes: data.notes ?? null,
      shared: data.shared ?? true,
      ownerId: userId,
      ownerName: "Admin",
      items: [],
    });
    return { id, code };
  }
  const created = await prisma!.setlist.create({
    data: {
      code,
      title: data.title,
      date: data.date ? new Date(`${data.date}T00:00:00Z`) : null,
      notes: data.notes ?? null,
      shared: data.shared ?? true,
      userId,
      items: {
        create: (data.items ?? []).map((it, position) => ({
          position,
          songId: it.songId ?? null,
          label: it.label ?? null,
          stanzas: it.stanzas ?? [],
          note: it.note ?? null,
        })),
      },
    },
  });
  return { id: created.id, code: created.code };
}

export async function updateSetlist(
  id: string,
  data: { title?: string; date?: string | null; notes?: string | null; shared?: boolean; items?: ItemInput[] },
): Promise<void> {
  if (isMockMode()) {
    const s = mockStore.get(id);
    if (s) Object.assign(s, { title: data.title ?? s.title, date: data.date ?? s.date, notes: data.notes ?? s.notes, shared: data.shared ?? s.shared });
    return;
  }
  await prisma!.$transaction(async (tx) => {
    await tx.setlist.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.date !== undefined && { date: data.date ? new Date(`${data.date}T00:00:00Z`) : null }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.shared !== undefined && { shared: data.shared }),
      },
    });
    if (data.items) {
      await tx.setlistItem.deleteMany({ where: { setlistId: id } });
      await tx.setlistItem.createMany({
        data: data.items.map((it, position) => ({
          setlistId: id,
          position,
          songId: it.songId ?? null,
          label: it.label ?? null,
          stanzas: it.stanzas ?? [],
          note: it.note ?? null,
        })),
      });
    }
  });
}

export async function appendSetlistItem(id: string, item: ItemInput): Promise<void> {
  if (isMockMode()) return;
  const last = await prisma!.setlistItem.aggregate({ where: { setlistId: id }, _max: { position: true } });
  await prisma!.setlistItem.create({
    data: {
      setlistId: id,
      position: (last._max.position ?? -1) + 1,
      songId: item.songId ?? null,
      label: item.label ?? null,
      stanzas: item.stanzas ?? [],
    },
  });
  await prisma!.setlist.update({ where: { id }, data: { updatedAt: new Date() } });
}

export async function deleteSetlist(id: string): Promise<void> {
  if (isMockMode()) {
    mockStore.delete(id);
    return;
  }
  await prisma!.setlist.delete({ where: { id } });
}

/** Owner check used by the API routes. */
export async function ownsSetlist(id: string, userId: string): Promise<boolean> {
  if (isMockMode()) return mockStore.get(id)?.ownerId === userId;
  if (!prisma) return false;
  const s = await prisma.setlist.findUnique({ where: { id }, select: { userId: true } });
  return s?.userId === userId;
}
