import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Languages
  const duala = await prisma.language.upsert({
    where: { code: "duala" },
    update: {},
    create: { code: "duala", name: "Duala" },
  });
  const french = await prisma.language.upsert({
    where: { code: "fr" },
    update: {},
    create: { code: "fr", name: "Français" },
  });
  const english = await prisma.language.upsert({
    where: { code: "en" },
    update: {},
    create: { code: "en", name: "English" },
  });

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: "spiritual" }, update: {}, create: { name: "spiritual", category: "MOOD" } }),
    prisma.tag.upsert({ where: { name: "praise" }, update: {}, create: { name: "praise", category: "THEME" } }),
    prisma.tag.upsert({ where: { name: "worship" }, update: {}, create: { name: "worship", category: "THEME" } }),
    prisma.tag.upsert({ where: { name: "storytelling" }, update: {}, create: { name: "storytelling", category: "STYLE" } }),
    prisma.tag.upsert({ where: { name: "joyful" }, update: {}, create: { name: "joyful", category: "MOOD" } }),
    prisma.tag.upsert({ where: { name: "solemn" }, update: {}, create: { name: "solemn", category: "MOOD" } }),
    prisma.tag.upsert({ where: { name: "traditional" }, update: {}, create: { name: "traditional", category: "ERA" } }),
    prisma.tag.upsert({ where: { name: "love" }, update: {}, create: { name: "love", category: "MOOD" } }),
  ]);

  // Authors
  const authors = await Promise.all([
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000001" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000001", name: "Pasteur Ndedi Eyango", bio: "Compositeur de cantiques traditionnels douala" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000002" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000002", name: "Mama Ngando", bio: "Chantre de l'église de Bonabéri" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000003" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000003", name: "Ebenezer Moulongo" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000004" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000004", name: "Chorale de Douala" } }),
  ]);

  // Admin user
  const admin = await prisma.userProfile.upsert({
    where: { supabaseUserId: "admin-seed-001" },
    update: {},
    create: {
      supabaseUserId: "admin-seed-001",
      displayName: "Admin",
      role: "ADMIN",
    },
  });

  // Regular users
  await prisma.userProfile.upsert({
    where: { supabaseUserId: "user-seed-001" },
    update: {},
    create: { supabaseUserId: "user-seed-001", displayName: "Marie Ekambi", role: "USER" },
  });
  await prisma.userProfile.upsert({
    where: { supabaseUserId: "user-seed-002" },
    update: {},
    create: { supabaseUserId: "user-seed-002", displayName: "Jean Priso", role: "USER" },
  });

  // Songs with versions
  const songsData = [
    {
      index: 1,
      title: "Nya Loba",
      status: "FINISHED" as const,
      lyrics: "Nya Loba, Nya Loba\nO mudi na bwam\nO mudi na bwam, Nya Loba\nNa sango na wé\n\nO ma pula mba na nyo\nO ma téyédi mba bunya\nNya Loba, Nya Loba\nNa tombédi wé",
      authorIndex: 0,
      tagIndices: [0, 1],
    },
    {
      index: 2,
      title: "Yesu Kristu",
      status: "FINISHED" as const,
      lyrics: "Yesu Kristu, Mwané ma Loba\nO bé na bwam bwa bésé\nO pula mba na nyo\nNa tombédi wé na lèm la mba\n\nO bé Nanga na mba\nO bé Loba na mba\nYesu Kristu, a bwam bwa mba",
      authorIndex: 1,
      tagIndices: [0, 2],
    },
    {
      index: 3,
      title: "Hosana",
      status: "FINISHED" as const,
      lyrics: "Hosana, Hosana\nNa kombo na Mulédi\nHosana na bulu ba kwédi\nHosana, Hosana\n\nA bé na nkémé\nA bé na ngéa\nMulédi ma bésé\nHosana, Hosana",
      authorIndex: 2,
      tagIndices: [1, 4],
    },
    {
      index: 4,
      title: "Loba a Bwam",
      status: "FINISHED" as const,
      lyrics: "Loba a bwam, Loba a bwam\nNa tèmèdi na miso ma wé\nLoba a bwam, a bwam bwa bésé\nNa nyo na é, na bunya na é\n\nO mulema mwa mba mu tomba\nNa sé ma Loba a bwam\nNa lèm la bwam la wé",
      authorIndex: 0,
      tagIndices: [0, 6],
    },
    {
      index: 5,
      title: "Sango na Bwam",
      status: "FINISHED" as const,
      lyrics: "Sango na bwam, sango na bwam\nNa sango na Yesu Kristu\nA bé na bwam bwa bésé\nA bé na bwam bwa bésé\n\nBana ba musango\nBana ba ndémbédi\nMiyéngédi ma Loba\nSango na bwam",
      authorIndex: 3,
      tagIndices: [1, 3, 6],
    },
    {
      index: 6,
      title: "Na Tombédi Wé",
      status: "DRAFT" as const,
      lyrics: "Na tombédi wé, Nya Loba\nNa tombédi wé na lèm la mba\nNa tombédi wé\n\nO ma tèmbédi mba bunya\nO ma téyédi mba",
      authorIndex: 1,
      tagIndices: [0, 5],
    },
    {
      index: 7,
      title: "Bwam bwa Loba",
      status: "FINISHED" as const,
      lyrics: "Bwam bwa Loba bu na mba\nBu na mba na bunya bwésé\nBwam bwa Loba\nBu na wé, bu na mba\n\nNa miso ma Loba\nNa lèm la Loba\nBwam bwa Loba bu na mba",
      authorIndex: 2,
      tagIndices: [2, 4, 6],
    },
    {
      index: 8,
      title: "Prière du Soir",
      status: "FINISHED" as const,
      lyrics: "Dans le calme du soir\nJe viens vers toi, Seigneur\nMon coeur cherche ta paix\nTa lumière dans la nuit\n\nGuide mes pas demain\nProtège ceux que j'aime\nDans le calme du soir\nJe te confie ma vie",
      authorIndex: 3,
      tagIndices: [0, 5],
    },
    {
      index: 9,
      title: "Ndolo na Loba",
      status: "DRAFT" as const,
      lyrics: "Ndolo na Loba\nNa mba a bé ndolo\nNdolo na Loba na bésé\n\nWé o si pula mba\nWé o si téyédi mba",
      authorIndex: 0,
      tagIndices: [7, 0],
    },
    {
      index: 10,
      title: "Alléluia Douala",
      status: "FINISHED" as const,
      lyrics: "Alléluia, Alléluia\nNa kombo na Loba\nAlléluia, Alléluia\nNa kombo na Yesu\n\nBésé ba tomba\nBésé ba sanga\nAlléluia na bulu ba kwédi\nAlléluia, Alléluia",
      authorIndex: 1,
      tagIndices: [1, 4, 6],
    },
  ];

  for (const data of songsData) {
    const song = await prisma.song.upsert({
      where: { index: data.index },
      update: {},
      create: {
        index: data.index,
        title: data.title,
        status: data.status,
      },
    });

    // Version
    await prisma.songVersion.upsert({
      where: { songId_versionNumber: { songId: song.id, versionNumber: 1 } },
      update: {},
      create: {
        songId: song.id,
        versionType: "ORIGINAL",
        lyrics: data.lyrics,
        versionNumber: 1,
      },
    });

    // Author
    await prisma.songAuthor.upsert({
      where: { songId_authorId: { songId: song.id, authorId: authors[data.authorIndex].id } },
      update: {},
      create: {
        songId: song.id,
        authorId: authors[data.authorIndex].id,
        displayOrder: 1,
      },
    });

    // Tags
    for (const tagIndex of data.tagIndices) {
      await prisma.songTag.upsert({
        where: { songId_tagId: { songId: song.id, tagId: tags[tagIndex].id } },
        update: {},
        create: { songId: song.id, tagId: tags[tagIndex].id },
      });
    }

    // Language (default to duala, song 8 is French)
    const langId = data.index === 8 ? french.id : duala.id;
    await prisma.songLanguage.upsert({
      where: { songId_languageId: { songId: song.id, languageId: langId } },
      update: {},
      create: { songId: song.id, languageId: langId },
    });
  }

  // Add an annotation to song 1
  const song1 = await prisma.song.findUnique({ where: { index: 1 }, include: { versions: true } });
  if (song1 && song1.versions[0]) {
    await prisma.annotation.upsert({
      where: { id: "ann00000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "ann00000-0000-0000-0000-000000000001",
        songVersionId: song1.versions[0].id,
        lineNumber: 1,
        lineText: "Nya Loba, Nya Loba",
        note: "\"Nya Loba\" signifie \"Dieu\" en langue Duala. Cette ouverture est une invocation directe.",
        createdById: admin.id,
      },
    });
  }

  // Add a note to song 3
  const song3 = await prisma.song.findUnique({ where: { index: 3 } });
  if (song3) {
    await prisma.songNote.upsert({
      where: { id: "note0000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "note0000-0000-0000-0000-000000000001",
        songId: song3.id,
        content: "Ce cantique est souvent chanté lors des entrées triomphales à l'église, inspiré par les Psaumes.",
        createdById: admin.id,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
