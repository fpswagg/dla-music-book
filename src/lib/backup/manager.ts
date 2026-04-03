import { prisma } from "@/lib/prisma";
import { isMockMode, hasSupabase, env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "backups";

function getStorageClient() {
  if (!hasSupabase()) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function createBackup(): Promise<{ filename: string; size: number } | null> {
  if (isMockMode() || !prisma) {
    console.log("[Mock] Backup creation requested");
    return { filename: `backup-mock-${new Date().toISOString()}.json`, size: 0 };
  }

  const [songs, songVersions, authors, songAuthors, tags, songTags, languages, songLanguages,
    collections, collectionSongs, annotations, songNotes, userProfiles, likes, previews] = await Promise.all([
    prisma.song.findMany(),
    prisma.songVersion.findMany(),
    prisma.author.findMany(),
    prisma.songAuthor.findMany(),
    prisma.tag.findMany(),
    prisma.songTag.findMany(),
    prisma.language.findMany(),
    prisma.songLanguage.findMany(),
    prisma.collection.findMany(),
    prisma.collectionSong.findMany(),
    prisma.annotation.findMany(),
    prisma.songNote.findMany(),
    prisma.userProfile.findMany(),
    prisma.like.findMany(),
    prisma.preview.findMany(),
  ]);

  const backup = {
    metadata: {
      createdAt: new Date().toISOString(),
      version: "1.0",
      tables: {
        songs: songs.length,
        songVersions: songVersions.length,
        authors: authors.length,
        tags: tags.length,
        languages: languages.length,
        collections: collections.length,
        userProfiles: userProfiles.length,
      },
    },
    data: {
      songs, songVersions, authors, songAuthors, tags, songTags,
      languages, songLanguages, collections, collectionSongs,
      annotations, songNotes, userProfiles, likes, previews,
    },
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

  const storage = getStorageClient();
  if (storage) {
    const { error } = await storage.storage
      .from(BUCKET)
      .upload(filename, json, { contentType: "application/json" });
    if (error) {
      console.error("Backup upload failed:", error);
      return null;
    }
  }

  return { filename, size: json.length };
}

export async function listBackups(): Promise<Array<{ name: string; size: number; createdAt: string }>> {
  if (isMockMode()) {
    return [
      { name: "backup-2024-06-01.json", size: 45000, createdAt: "2024-06-01T12:00:00Z" },
      { name: "backup-2024-05-15.json", size: 42000, createdAt: "2024-05-15T08:30:00Z" },
    ];
  }

  const storage = getStorageClient();
  if (!storage) return [];

  const { data, error } = await storage.storage.from(BUCKET).list();
  if (error || !data) return [];

  return data.map((f) => ({
    name: f.name,
    size: f.metadata?.size ?? 0,
    createdAt: f.created_at ?? new Date(0).toISOString(),
  }));
}

export async function downloadBackup(filename: string): Promise<string | null> {
  const storage = getStorageClient();
  if (!storage) return null;

  const { data, error } = await storage.storage.from(BUCKET).download(filename);
  if (error || !data) return null;

  return await data.text();
}
