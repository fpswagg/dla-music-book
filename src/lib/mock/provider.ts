import mockData from "./data.json";

export type MockSong = (typeof mockData.songs)[number];
export type MockAuthor = (typeof mockData.authors)[number];
export type MockTag = (typeof mockData.tags)[number];
export type MockLanguage = (typeof mockData.languages)[number];
export type MockCollection = (typeof mockData.collections)[number];

export function getMockSongs(filters?: {
  q?: string;
  status?: string;
  language?: string;
  mood?: string;
  tag?: string;
  author?: string;
}): MockSong[] {
  let songs = [...mockData.songs];

  if (filters?.status) {
    songs = songs.filter((s) => s.status === filters.status);
  }

  if (filters?.language) {
    songs = songs.filter((s) =>
      s.languages.some((l) => l.code === filters.language)
    );
  }

  const tagKey = filters?.tag || filters?.mood;
  if (tagKey) {
    const keyLower = tagKey.toLowerCase();
    songs = songs.filter((s) =>
      s.tags.some((t) => {
        const nameValues = Object.values(t.name);
        return (
          t.key.toLowerCase() === keyLower ||
          nameValues.some((v) => v.toLowerCase() === keyLower)
        );
      })
    );
  }

  if (filters?.author) {
    songs = songs.filter((s) =>
      s.authors.some((a) =>
        a.name.toLowerCase().includes(filters.author!.toLowerCase())
      )
    );
  }

  if (filters?.q) {
    const query = filters.q.toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.index.toString() === query ||
        s.authors.some((a) => a.name.toLowerCase().includes(query)) ||
        s.versions.some((v) => v.lyrics.toLowerCase().includes(query))
    );
  }

  return songs;
}

export function getMockSongById(id: string): MockSong | undefined {
  return mockData.songs.find((s) => s.id === id);
}

export function getMockSongByIndex(index: number): MockSong | undefined {
  return mockData.songs.find((s) => s.index === index);
}

export function getMockAuthors(): MockAuthor[] {
  return mockData.authors;
}

export function getMockTags(): MockTag[] {
  return mockData.tags;
}

export function getMockLanguages(): MockLanguage[] {
  return mockData.languages;
}

export function getMockCollections(publicOnly = false) {
  if (publicOnly) {
    return mockData.collections.filter((c) => c.status === "PUBLIC");
  }
  return mockData.collections;
}

const mockLikes = () =>
  (mockData as { likes?: { userId: string; songId: string }[] }).likes ?? [];

export function getMockUserLikedSongIds(
  userId: string,
  songIds: string[],
): Record<string, boolean> {
  const liked = new Set(
    mockLikes()
      .filter((l) => l.userId === userId && songIds.includes(l.songId))
      .map((l) => l.songId),
  );
  const out: Record<string, boolean> = {};
  for (const id of songIds) out[id] = liked.has(id);
  return out;
}

export function getMockUserLikedSongs(userId: string): MockSong[] {
  const ids = mockLikes()
    .filter((l) => l.userId === userId)
    .map((l) => l.songId);
  return ids
    .map((id) => getMockSongById(id))
    .filter((s): s is MockSong => !!s);
}

const extraMockCollections: Array<
  MockCollection & { userId: string; songs: string[] }
> = [];

export function getMockUserCollections(userId: string): MockCollection[] {
  const extra = extraMockCollections.filter((c) => c.userId === userId);
  const extraIds = new Set(extra.map((c) => c.id));
  const base = mockData.collections.filter(
    (c) =>
      (c as MockCollection & { userId?: string }).userId === userId &&
      !extraIds.has(c.id),
  );
  return [...base, ...extra];
}

export function addMockUserCollection(
  col: MockCollection & { userId: string; songs: string[] },
) {
  extraMockCollections.push(col);
}

export function removeMockUserCollection(id: string) {
  const i = extraMockCollections.findIndex((c) => c.id === id);
  if (i >= 0) extraMockCollections.splice(i, 1);
}

export function updateMockUserCollection(
  id: string,
  patch: Partial<MockCollection & { userId: string; songs: string[] }>,
) {
  const c = extraMockCollections.find((x) => x.id === id);
  if (c) Object.assign(c, patch);
}

export function addSongToMockUserCollection(
  collectionId: string,
  songId: string,
  userId: string,
) {
  let c = extraMockCollections.find((x) => x.id === collectionId);
  if (!c) {
    const base = mockData.collections.find((x) => x.id === collectionId) as
      | (MockCollection & { userId?: string; songs: string[] })
      | undefined;
    if (base && base.userId === userId) {
      c = {
        ...base,
        userId: base.userId!,
        songs: [...base.songs],
      };
      extraMockCollections.push(c);
    }
  }
  if (c && !c.songs.includes(songId)) c.songs.push(songId);
}

export function removeSongFromMockUserCollection(
  collectionId: string,
  songId: string,
  userId: string,
) {
  let c = extraMockCollections.find((x) => x.id === collectionId);
  if (!c) {
    const base = mockData.collections.find((x) => x.id === collectionId) as
      | (MockCollection & { userId?: string; songs: string[] })
      | undefined;
    if (base && base.userId === userId) {
      c = {
        ...base,
        userId: base.userId!,
        songs: [...base.songs],
      };
      extraMockCollections.push(c);
    }
  }
  if (c) c.songs = c.songs.filter((id) => id !== songId);
}

export function getMockCollectionByIdMerged(
  id: string,
): (MockCollection & { userId?: string; songs: string[] }) | undefined {
  const ex = extraMockCollections.find((c) => c.id === id);
  if (ex) return ex;
  const base = mockData.collections.find((c) => c.id === id) as
    | (MockCollection & { userId?: string; songs: string[] })
    | undefined;
  return base;
}

export function getMockUsers() {
  return mockData.users;
}

export function getMockCurrentUser() {
  return mockData.users.find((u) => u.role === "ADMIN")!;
}
