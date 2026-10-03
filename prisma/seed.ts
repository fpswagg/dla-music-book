/**
 * Development seed: languages, tags, hymnals, authors and sample hymns.
 * Idempotent (upserts). Run with `pnpm db:seed`. Never needed in production.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseLyrics, plainLyrics, serializeLyrics, type LyricsContent } from "../src/lib/lyrics";
import { buildSearchText } from "../src/lib/duala";
import { parseReferences } from "../src/lib/references";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const HYMNALS = [
  { code: "M.B.", name: "Myenge ma Bonakristo (édition précédente)", aliases: ["M. B.", "MB"], sortOrder: 1 },
  { code: "S. S. et S.", name: "Sacred Songs and Solos (Ira D. Sankey)", aliases: ["S.S. et S.", "S. S. & S.", "SS&S", "S.S.S."], sortOrder: 2 },
  { code: "Evang. S.", name: "Evangeliums-Sänger", aliases: ["Evang.S.", "Ev. S."], sortOrder: 3 },
  { code: "W.", name: "Württembergisches Choralbuch", aliases: ["W"], sortOrder: 4 },
];

/** Hymns 5–7 transcribed from a scan of the book (ref/mmb-page-structure.jpg) — to be proofread. */
const BOOK_SAMPLES: Array<{ index: number; page: number; refs: string; text: string }> = [
  {
    index: 5,
    page: 10,
    refs: "M.B.8. - Evang. S. 189",
    text: `1. Edube na Loba!
Mo̱ń na wase, kasa!
Sesa Sango!
Namse̱ Musungedi
ńa ndolo na ndedi,
nu Mun'a mudongi:
Yesu Sango.

2. Dinge̱le̱ bejedi,
basangi ba lati
sesa Sango.
Bińo̱ basungabe̱,
bińo̱ bapo̱so̱be̱,
abwe̱le̱ pandise̱
Yesu Sango.

3. Bińo̱ be̱se̱, lata
o kolise̱ Loba,
sesa Sango.
Sombise̱ na lo̱ngo̱,
lo to̱ise̱ omo̱ńmo̱ń
sesa na mudi mo̱
Yesu Sango.`,
  },
  {
    index: 6,
    page: 10,
    refs: "M. B. 11. - S. S. et S. 621",
    text: `1. Loba le bwam! mo̱ń na wase,
minja, midongo na mindi,
madoi ma be̱se̱ ma kwale
na: "Me̱se̱ Loba a weki."

2. Bińo̱ lo̱ngo̱ la mo̱ń pe̱ ya!
Na madoi ma myenge sesa!
Mwemba mo̱ na ngo̱ na mbua.
te̱, lo̱ngo̱ na sesa Loba!

3. Na sengi ngo̱ na bemune̱.
misima ma kwań na myo̱pi
ba kwalisan mo̱ na nune̱:
Loba nde e Muwekedi.

4. Bola so̱ mo̱ musesako,
nu boli mpo̱m mao ma muna
ka jabea la babobe;
sesa pe̱ mo̱ nu sungi wa.`,
  },
  {
    index: 7,
    page: 10,
    refs: "M. B. 13. - S. S. et S. 62",
    text: `1. Sesa Sango na doi lasu,
na mulema di sese mo̱:
bebolo bao be mabele̱
o sesa mo̱ na muńenge̱.

2. A weki ngengeti ńa mo̱ń
a langi na muso̱ngi mao
ka njib'a munja mundene̱,
e jangwa buka dimene̱.

3. Mo̱nd'a longi Yerusale̱m,
mo̱ nd'a ko̱te̱le̱ matumba:
a bo̱bise̱ midi myambi,
a bo̱lise baboedi.

4. Loba lasu e bondene̱
nde nded'ao pe̱ e tingame̱;
a namse̱ bapī na babwam,
a sib'se̱ babobe 'wase.`,
  },
];

const json = (c: LyricsContent) => c as unknown as object;

async function main() {
  const duala = await prisma.language.upsert({
    where: { code: "duala" },
    update: {},
    create: { code: "duala", name: { fr: "Duala", en: "Duala", duala: "Duala" } },
  });
  const french = await prisma.language.upsert({
    where: { code: "fr" },
    update: {},
    create: { code: "fr", name: { fr: "Français", en: "French", duala: "Frañse" } },
  });
  await prisma.language.upsert({
    where: { code: "en" },
    update: {},
    create: { code: "en", name: { fr: "Anglais", en: "English", duala: "Anglis" } },
  });

  const tagSeeds = [
    { key: "spiritual", name: { fr: "Spirituel", en: "Spiritual", duala: "Mudi" }, category: "MOOD" },
    { key: "praise", name: { fr: "Louange", en: "Praise", duala: "Tombédi" }, category: "THEME" },
    { key: "worship", name: { fr: "Adoration", en: "Worship", duala: "Nyamsi" }, category: "THEME" },
    { key: "storytelling", name: { fr: "Récit", en: "Storytelling", duala: "Musango" }, category: "STYLE" },
    { key: "joyful", name: { fr: "Joyeux", en: "Joyful", duala: "Bisima" }, category: "MOOD" },
    { key: "solemn", name: { fr: "Solennel", en: "Solemn", duala: "Nkémé" }, category: "MOOD" },
    { key: "traditional", name: { fr: "Traditionnel", en: "Traditional", duala: "Mbassa" }, category: "ERA" },
    { key: "love", name: { fr: "Amour", en: "Love", duala: "Ndolo" }, category: "MOOD" },
  ] as const;
  const tags = await Promise.all(
    tagSeeds.map((t) => prisma.tag.upsert({ where: { key: t.key }, update: {}, create: { ...t, name: { ...t.name } } })),
  );

  const hymnals = await Promise.all(
    HYMNALS.map((h) => prisma.hymnal.upsert({ where: { code: h.code }, update: { aliases: h.aliases }, create: h })),
  );

  const authors = await Promise.all(
    [
      { id: "a1000000-0000-0000-0000-000000000001", name: "Pasteur Ndedi Eyango", bio: "Compositeur de cantiques traditionnels douala" },
      { id: "a1000000-0000-0000-0000-000000000002", name: "Mama Ngando", bio: "Chantre de l'église de Bonabéri" },
      { id: "a1000000-0000-0000-0000-000000000003", name: "Ebenezer Moulongo", bio: null },
      { id: "a1000000-0000-0000-0000-000000000004", name: "Chorale de Douala", bio: null },
    ].map((a) => prisma.author.upsert({ where: { id: a.id }, update: {}, create: a })),
  );

  // Owner of seeded notes/annotations. Cannot sign in (no password, .invalid address).
  const admin = await prisma.user.upsert({
    where: { email: "seed-admin@users.invalid" },
    update: {},
    create: { email: "seed-admin@users.invalid", displayName: "Admin", role: "ADMIN" },
  });

  type SongSeed = { index: number; title?: string; status: "FINISHED" | "DRAFT"; text: string; page?: number; refs?: string; author?: number; tags?: number[]; french?: boolean };

  const songs: SongSeed[] = [
    ...BOOK_SAMPLES.map((s) => ({ index: s.index, status: "FINISHED" as const, text: s.text, page: s.page, refs: s.refs, tags: [1, 6] })),
    { index: 1, title: "Nya Loba", status: "FINISHED", author: 0, tags: [0, 1], text: "1. Nya Loba, Nya Loba\nO mudi na bwam\nO mudi na bwam, Nya Loba\nNa sango na wé\n\nR. Na tombédi wé,\nNa tombédi wé!\n\n2. O ma pula mba na nyo\nO ma téyédi mba bunya\nNya Loba, Nya Loba\nNa tombédi wé" },
    { index: 2, title: "Yesu Kristu", status: "FINISHED", author: 1, tags: [0, 2], text: "Yesu Kristu, Mwané ma Loba\nO bé na bwam bwa bésé\nO pula mba na nyo\nNa tombédi wé na lèm la mba\n\nO bé Nanga na mba\nO bé Loba na mba\nYesu Kristu, a bwam bwa mba" },
    { index: 3, title: "Hosana", status: "FINISHED", author: 2, tags: [1, 4], text: "1. Hosana, Hosana\nNa kombo na Mulédi\nHosana na bulu ba kwédi\nHosana, Hosana\n\n2. A bé na nkémé\nA bé na ngéa\nMulédi ma bésé\nHosana, Hosana" },
    { index: 8, title: "Prière du Soir", status: "FINISHED", author: 3, tags: [0, 5], french: true, text: "1. Dans le calme du soir\nJe viens vers toi, Seigneur\nMon cœur cherche ta paix\nTa lumière dans la nuit\n\n2. Guide mes pas demain\nProtège ceux que j'aime\nDans le calme du soir\nJe te confie ma vie" },
    { index: 9, title: "Ndolo na Loba", status: "DRAFT", author: 0, tags: [7, 0], text: "Ndolo na Loba\nNa mba a bé ndolo\nNdolo na Loba na bésé" },
  ];

  for (const s of songs) {
    const content = parseLyrics(s.text);
    const lyrics = serializeLyrics(content);
    const refs = s.refs ? parseReferences(s.refs, hymnals) : [];
    const title = s.title ?? (content.blocks[0]?.lines[0] ?? `${s.index}`).replace(/[,;:!.\s]+$/, "");
    const searchText = buildSearchText([title, plainLyrics(content), ...refs.map((r) => `${r.code} ${r.number}`)]);

    const existing = await prisma.song.findUnique({ where: { index: s.index } });
    if (existing) continue; // never overwrite data in an existing database

    const song = await prisma.song.create({
      data: {
        index: s.index,
        title,
        status: s.status,
        page: s.page ?? null,
        searchText,
        versions: { create: { versionNumber: 1, versionType: "ORIGINAL", lyrics, content: json(content) } },
        songLanguages: { create: { languageId: s.french ? french.id : duala.id } },
        ...(s.author !== undefined && { songAuthors: { create: { authorId: authors[s.author].id, displayOrder: 1 } } }),
        ...(s.tags && { songTags: { create: s.tags.map((i) => ({ tagId: tags[i].id })) } }),
      },
    });
    for (const [i, r] of refs.entries()) {
      if (r.hymnalId) await prisma.songReference.create({ data: { songId: song.id, hymnalId: r.hymnalId, number: r.number, displayOrder: i } });
    }
  }

  const song1 = await prisma.song.findUnique({ where: { index: 1 }, include: { versions: true } });
  if (song1?.versions[0] && !(await prisma.annotation.count({ where: { songVersionId: song1.versions[0].id } }))) {
    await prisma.annotation.create({
      data: {
        songVersionId: song1.versions[0].id,
        lineNumber: 1,
        lineText: "Nya Loba, Nya Loba",
        note: "« Nya Loba » : invocation directe de Dieu en duala.",
        createdById: admin.id,
      },
    });
  }

  const colSongs = await prisma.song.findMany({ where: { index: { in: [1, 2, 3, 5, 6, 7] } } });
  const col = await prisma.collection.upsert({
    where: { id: "c1000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "c1000000-0000-0000-0000-000000000001",
      name: { fr: "Cantiques du Dimanche", en: "Sunday Hymns", duala: "Myenge ma Sonde" },
      description: { fr: "Les cantiques les plus chantés lors des cultes dominicaux", en: "The most sung hymns during Sunday worship" },
      isPublic: true,
      status: "PUBLIC",
      userId: admin.id,
    },
  });
  for (const [i, s] of colSongs.entries()) {
    await prisma.collectionSong.upsert({
      where: { collectionId_songId: { collectionId: col.id, songId: s.id } },
      update: {},
      create: { collectionId: col.id, songId: s.id, displayOrder: i },
    });
  }

  console.log(`Seed done: ${songs.length} sample hymns, ${hymnals.length} hymnals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
