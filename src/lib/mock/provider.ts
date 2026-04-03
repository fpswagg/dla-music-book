import mockData from "./data.json";

export type MockSong = (typeof mockData.songs)[number];
export type MockAuthor = (typeof mockData.authors)[number];
export type MockTag = (typeof mockData.tags)[number];
export type MockLanguage = (typeof mockData.languages)[number];

export function getMockSongs(filters?: {
  q?: string;
  status?: string;
  language?: string;
  mood?: string;
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

  if (filters?.mood) {
    songs = songs.filter((s) =>
      s.tags.some((t) => t.name === filters.mood)
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
    return mockData.collections.filter((c) => c.isPublic);
  }
  return mockData.collections;
}

export function getMockUsers() {
  return mockData.users;
}

export function getMockCurrentUser() {
  return mockData.users.find((u) => u.role === "ADMIN")!;
}
