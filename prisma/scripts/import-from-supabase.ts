/**
 * Cut-over: copy the production data still living in Supabase into this database.
 *
 *   SOURCE_DATABASE_URL=postgresql://…supabase…  pnpm import:supabase            # dry run (read only)
 *   SOURCE_DATABASE_URL=…                         pnpm import:supabase --apply    # write
 *   … --apply --copy-previews   # also re-upload preview audio from Supabase Storage to SA Storage
 *
 * - Reads the old tables (UserProfile, Song, SongVersion, …) and auth.users from the source.
 *   Never writes to the source.
 * - Ids are kept, so links and relations survive. Users are created from their Supabase email
 *   (emailVerified kept, no password: they use "forgot password", a magic link, Google, or an
 *   admin reset link). Roles are kept.
 * - Refuses to run when the target already has hymns with the same numbers but different ids
 *   (e.g. sample data): reset the target database first (Satubo / SPT), then import.
 * - Lyrics are parsed into the structured format and search text is computed.
 */
import "dotenv/config";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { parseLyrics, plainLyrics, serializeLyrics } from "../../src/lib/lyrics";
import { buildSearchText } from "../../src/lib/duala";

const apply = process.argv.includes("--apply");
const copyPreviews = process.argv.includes("--copy-previews");
const sourceUrl = process.env.SOURCE_DATABASE_URL;
if (!sourceUrl) throw new Error("Set SOURCE_DATABASE_URL to the Supabase Postgres connection string.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL (target) is not set.");

const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const source = new Client({ connectionString: sourceUrl, ssl: sourceUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined });

type Row = Record<string, unknown>;
const q = async <T = Row>(sql: string): Promise<T[]> => (await source.query(sql)).rows as T[];
const s = (v: unknown) => (v == null ? null : String(v));
const d = (v: unknown) => (v instanceof Date ? v : new Date(String(v)));

async function uploadToSaStorage(url: string, key: string): Promise<string | null> {
  const base = (process.env.SASTORAGE_URL ?? "").replace(/\/$/, "");
  const token = process.env.SASTORAGE_TOKEN;
  if (!base || !token) throw new Error("SASTORAGE_URL / SASTORAGE_TOKEN are needed for --copy-previews");
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  const form = new FormData();
  form.append("file", blob, key.split("/").pop() ?? "audio");
  form.append("key", key);
  const up = await fetch(`${base}/api/files`, { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
  if (!up.ok) return null;
  const { object } = (await up.json()) as { object: { key: string } };
  return `${base}/files/${object.key.split("/").map(encodeURIComponent).join("/")}`;
}

async function main() {
  await source.connect();
  await source.query("SET default_transaction_read_only = on");

  const [profiles, authUsers, languages, authors, tags, songs, versions, songAuthors, songTags, songLanguages, collections, collectionSongs, annotations, notes, likes, previews] =
    await Promise.all([
      q(`select * from "UserProfile"`),
      q<{ id: string; email: string | null; email_confirmed_at: Date | null }>(`select id::text, email, email_confirmed_at from auth.users`),
      q(`select * from "Language"`),
      q(`select * from "Author"`),
      q(`select * from "Tag"`),
      q(`select * from "Song"`),
      q(`select * from "SongVersion"`),
      q(`select * from "SongAuthor"`),
      q(`select * from "SongTag"`),
      q(`select * from "SongLanguage"`),
      q(`select * from "Collection"`),
      q(`select * from "CollectionSong"`),
      q(`select * from "Annotation"`),
      q(`select * from "SongNote"`),
      q(`select * from "Like"`),
      q(`select * from "Preview"`),
    ]);

  console.log("Source:", {
    users: profiles.length,
    songs: songs.length,
    versions: versions.length,
    authors: authors.length,
    tags: tags.length,
    collections: collections.length,
    likes: likes.length,
    previews: previews.length,
  });

  // Number clashes with what is already in the target.
  const existing = await target.song.findMany({ select: { id: true, index: true } });
  const byIndex = new Map(existing.map((x) => [x.index, x.id]));
  const clashes = songs.filter((x) => byIndex.has(Number(x.index)) && byIndex.get(Number(x.index)) !== x.id);
  if (clashes.length) {
    console.error(
      `Target already has ${clashes.length} hymn number(s) used by other songs (e.g. ${clashes
        .slice(0, 10)
        .map((x) => x.index)
        .join(", ")}). Reset the target database before importing.`,
    );
    process.exit(2);
  }

  const emailById = new Map(authUsers.map((u) => [u.id, u]));
  const userRows = profiles.map((p) => {
    const auth = emailById.get(String(p.supabaseUserId));
    return {
      id: String(p.id),
      displayName: String(p.displayName),
      email: (auth?.email ?? `legacy-${p.supabaseUserId}@users.invalid`).toLowerCase(),
      emailVerified: !!auth?.email_confirmed_at,
      role: p.role === "ADMIN" ? ("ADMIN" as const) : ("USER" as const),
      createdAt: d(p.createdAt),
    };
  });
  const noEmail = userRows.filter((u) => u.email.endsWith("@users.invalid")).length;
  console.log(`Users: ${userRows.length} (${noEmail} without email in Supabase)`);

  if (!apply) {
    console.log("Dry run OK — nothing written. Add --apply to import.");
    return;
  }

  const upsertMany = async <T extends { id: string }>(label: string, rows: T[], fn: (r: T) => Promise<unknown>) => {
    for (const r of rows) await fn(r);
    console.log(`  ${label}: ${rows.length}`);
  };

  await upsertMany("users", userRows, (u) =>
    target.user.upsert({ where: { id: u.id }, update: { role: u.role }, create: { ...u, updatedAt: new Date() } }),
  );
  await upsertMany("languages", languages as Array<Row & { id: string }>, (l) =>
    target.language.upsert({ where: { code: String(l.code) }, update: {}, create: { id: l.id, code: String(l.code), name: l.name as object } }),
  );
  const langIdByCode = new Map((await target.language.findMany()).map((l) => [l.code, l.id]));
  const langIdMap = new Map(languages.map((l) => [String(l.id), langIdByCode.get(String(l.code))!]));

  await upsertMany("authors", authors as Array<Row & { id: string }>, (a) =>
    target.author.upsert({ where: { id: a.id }, update: {}, create: { id: a.id, name: String(a.name), bio: s(a.bio) } }),
  );
  await upsertMany("tags", tags as Array<Row & { id: string }>, (t) =>
    target.tag.upsert({ where: { key: String(t.key) }, update: {}, create: { id: t.id, key: String(t.key), name: t.name as object, category: t.category as never } }),
  );
  const tagIdByKey = new Map((await target.tag.findMany()).map((t) => [t.key, t.id]));
  const tagIdMap = new Map(tags.map((t) => [String(t.id), tagIdByKey.get(String(t.key))!]));

  // Songs without the originalSongId link first, then the links (self relation).
  await upsertMany("songs", songs as Array<Row & { id: string }>, (x) =>
    target.song.upsert({
      where: { id: x.id },
      update: {},
      create: { id: x.id, index: Number(x.index), title: String(x.title), status: x.status as never, createdAt: d(x.createdAt), updatedAt: d(x.updatedAt) },
    }),
  );
  for (const x of songs.filter((x) => x.originalSongId)) {
    await target.song.update({ where: { id: String(x.id) }, data: { originalSongId: String(x.originalSongId) } });
  }

  await upsertMany("versions", versions as Array<Row & { id: string }>, (v) => {
    const content = parseLyrics(String(v.lyrics ?? ""));
    return target.songVersion.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        songId: String(v.songId),
        versionType: v.versionType as never,
        versionNumber: Number(v.versionNumber),
        lyrics: serializeLyrics(content),
        content: content as unknown as object,
        createdAt: d(v.createdAt),
      },
    });
  });

  for (const r of songAuthors) {
    await target.songAuthor.upsert({
      where: { songId_authorId: { songId: String(r.songId), authorId: String(r.authorId) } },
      update: {},
      create: { songId: String(r.songId), authorId: String(r.authorId), displayOrder: Number(r.displayOrder ?? 1) },
    });
  }
  for (const r of songTags) {
    const tagId = tagIdMap.get(String(r.tagId));
    if (tagId) await target.songTag.upsert({ where: { songId_tagId: { songId: String(r.songId), tagId } }, update: {}, create: { songId: String(r.songId), tagId } });
  }
  for (const r of songLanguages) {
    const languageId = langIdMap.get(String(r.languageId));
    if (languageId)
      await target.songLanguage.upsert({
        where: { songId_languageId: { songId: String(r.songId), languageId } },
        update: {},
        create: { songId: String(r.songId), languageId },
      });
  }
  console.log(`  song links: ${songAuthors.length + songTags.length + songLanguages.length}`);

  await upsertMany("collections", collections as Array<Row & { id: string }>, (c) =>
    target.collection.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name as object,
        description: (c.description as object) ?? undefined,
        isPublic: !!c.isPublic,
        status: c.status as never,
        userId: String(c.userId),
        createdAt: d(c.createdAt),
      },
    }),
  );
  for (const r of collectionSongs) {
    await target.collectionSong.upsert({
      where: { collectionId_songId: { collectionId: String(r.collectionId), songId: String(r.songId) } },
      update: {},
      create: { collectionId: String(r.collectionId), songId: String(r.songId), displayOrder: Number(r.displayOrder ?? 0) },
    });
  }
  await upsertMany("annotations", annotations as Array<Row & { id: string }>, (a) =>
    target.annotation.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        songVersionId: String(a.songVersionId),
        lineNumber: Number(a.lineNumber),
        lineText: String(a.lineText),
        note: String(a.note),
        createdById: String(a.createdById),
        createdAt: d(a.createdAt),
      },
    }),
  );
  await upsertMany("notes", notes as Array<Row & { id: string }>, (n) =>
    target.songNote.upsert({
      where: { id: n.id },
      update: {},
      create: { id: n.id, songId: String(n.songId), content: String(n.content), createdById: String(n.createdById), createdAt: d(n.createdAt) },
    }),
  );
  await upsertMany("likes", likes as Array<Row & { id: string }>, (l) =>
    target.like.upsert({
      where: { userId_songId: { userId: String(l.userId), songId: String(l.songId) } },
      update: {},
      create: { id: l.id, userId: String(l.userId), songId: String(l.songId), createdAt: d(l.createdAt) },
    }),
  );

  let copied = 0;
  await upsertMany("previews", previews as Array<Row & { id: string }>, async (p) => {
    let fileUrl = String(p.fileUrl);
    if (copyPreviews && fileUrl.includes("supabase")) {
      const ext = fileUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? "mp3";
      const moved = await uploadToSaStorage(fileUrl, `previews/${p.songVersionId}/${p.id}.${/^[a-z0-9]{1,5}$/.test(ext) ? ext : "mp3"}`);
      if (moved) {
        fileUrl = moved;
        copied++;
      } else console.warn(`  ! could not copy preview ${p.id}`);
    }
    return target.preview.upsert({
      where: { id: p.id },
      update: { fileUrl },
      create: { id: p.id, songVersionId: String(p.songVersionId), fileUrl, durationSeconds: Number(p.durationSeconds ?? 0), uploadedAt: d(p.uploadedAt) },
    });
  });
  if (copyPreviews) console.log(`  previews copied to SA Storage: ${copied}`);

  // Search text for every imported hymn.
  const imported = await target.song.findMany({
    where: { id: { in: songs.map((x) => String(x.id)) } },
    select: { id: true, title: true, versions: { select: { content: true, lyrics: true } }, songAuthors: { select: { author: { select: { name: true } } } } },
  });
  for (const x of imported) {
    const searchText = buildSearchText([
      x.title,
      ...x.versions.map((v) => plainLyrics(parseLyrics(v.lyrics))),
      ...x.songAuthors.map((a) => a.author.name),
    ]);
    await target.song.update({ where: { id: x.id }, data: { searchText } });
  }
  console.log("Import done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await source.end().catch(() => undefined);
    await target.$disconnect();
  });
