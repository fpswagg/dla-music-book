import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/config";
import { downloadText, hasSaStorage, listFiles, uploadFile } from "@/lib/sastorage";

/** Folder under the SA Storage token prefix. */
const BACKUP_DIR = "backups/";

export async function createBackup(): Promise<{ filename: string; size: number } | null> {
  if (isMockMode() || !prisma) {
    console.log("[Mock] Backup creation requested");
    return { filename: `backup-mock-${new Date().toISOString()}.json`, size: 0 };
  }

  const [songs, songVersions, authors, songAuthors, tags, songTags, languages, songLanguages,
    hymnals, songReferences, collections, collectionSongs, setlists, setlistItems,
    annotations, songNotes, users, likes, previews] = await Promise.all([
    prisma.song.findMany(),
    prisma.songVersion.findMany(),
    prisma.author.findMany(),
    prisma.songAuthor.findMany(),
    prisma.tag.findMany(),
    prisma.songTag.findMany(),
    prisma.language.findMany(),
    prisma.songLanguage.findMany(),
    prisma.hymnal.findMany(),
    prisma.songReference.findMany(),
    prisma.collection.findMany(),
    prisma.collectionSong.findMany(),
    prisma.setlist.findMany(),
    prisma.setlistItem.findMany(),
    prisma.annotation.findMany(),
    prisma.songNote.findMany(),
    // Profiles only: no password hashes, OAuth tokens or sessions in backup files.
    prisma.user.findMany({
      select: { id: true, displayName: true, email: true, emailVerified: true, role: true, banned: true, createdAt: true },
    }),
    prisma.like.findMany(),
    prisma.preview.findMany(),
  ]);

  const backup = {
    metadata: {
      createdAt: new Date().toISOString(),
      version: "2.0",
      tables: {
        songs: songs.length,
        songVersions: songVersions.length,
        authors: authors.length,
        tags: tags.length,
        languages: languages.length,
        hymnals: hymnals.length,
        collections: collections.length,
        setlists: setlists.length,
        users: users.length,
      },
    },
    data: {
      songs, songVersions, authors, songAuthors, tags, songTags, languages, songLanguages,
      hymnals, songReferences, collections, collectionSongs, setlists, setlistItems,
      annotations, songNotes, users, likes, previews,
    },
  };

  const json = JSON.stringify(backup, null, 2);
  // SA Storage files are publicly readable by key, so the name carries an unguessable suffix.
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID()}.json`;

  if (hasSaStorage()) {
    try {
      await uploadFile(`${BACKUP_DIR}${filename}`, json, "application/json");
    } catch (error) {
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

  if (!hasSaStorage()) return [];

  try {
    const files = await listFiles(BACKUP_DIR);
    return files
      .map((f) => ({
        name: f.key.split("/").pop() ?? f.key,
        size: f.size ?? 0,
        createdAt: f.lastModified ?? new Date(0).toISOString(),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error("Listing backups failed:", error);
    return [];
  }
}

export async function downloadBackup(filename: string): Promise<string | null> {
  if (!hasSaStorage() || !/^[\w.-]+\.json$/.test(filename)) return null;
  const file = (await listFiles(`${BACKUP_DIR}${filename}`)).find((f) => f.key.endsWith(`/${filename}`));
  return file ? await downloadText(file.key) : null;
}
