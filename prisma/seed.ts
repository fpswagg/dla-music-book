import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { key: "spiritual" }, update: {}, create: { key: "spiritual", name: { fr: "Spirituel", en: "Spiritual", duala: "Mudi" }, category: "MOOD" } }),
    prisma.tag.upsert({ where: { key: "praise" }, update: {}, create: { key: "praise", name: { fr: "Louange", en: "Praise", duala: "Tombédi" }, category: "THEME" } }),
    prisma.tag.upsert({ where: { key: "worship" }, update: {}, create: { key: "worship", name: { fr: "Adoration", en: "Worship", duala: "Nyamsi" }, category: "THEME" } }),
    prisma.tag.upsert({ where: { key: "storytelling" }, update: {}, create: { key: "storytelling", name: { fr: "Récit", en: "Storytelling", duala: "Musango" }, category: "STYLE" } }),
    prisma.tag.upsert({ where: { key: "joyful" }, update: {}, create: { key: "joyful", name: { fr: "Joyeux", en: "Joyful", duala: "Bisima" }, category: "MOOD" } }),
    prisma.tag.upsert({ where: { key: "solemn" }, update: {}, create: { key: "solemn", name: { fr: "Solennel", en: "Solemn", duala: "Nkémé" }, category: "MOOD" } }),
    prisma.tag.upsert({ where: { key: "traditional" }, update: {}, create: { key: "traditional", name: { fr: "Traditionnel", en: "Traditional", duala: "Mbassa" }, category: "ERA" } }),
    prisma.tag.upsert({ where: { key: "love" }, update: {}, create: { key: "love", name: { fr: "Amour", en: "Love", duala: "Ndolo" }, category: "MOOD" } }),
  ]);

  const authors = await Promise.all([
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000001" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000001", name: "Pasteur Ndedi Eyango", bio: "Compositeur de cantiques traditionnels douala" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000002" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000002", name: "Mama Ngando", bio: "Chantre de l'église de Bonabéri" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000003" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000003", name: "Ebenezer Moulongo" } }),
    prisma.author.upsert({ where: { id: "a1000000-0000-0000-0000-000000000004" }, update: {}, create: { id: "a1000000-0000-0000-0000-000000000004", name: "Chorale de Douala" } }),
  ]);

  const admin = await prisma.userProfile.upsert({
    where: { supabaseUserId: "admin-seed-001" },
    update: {},
    create: { supabaseUserId: "admin-seed-001", displayName: "Admin", role: "ADMIN" },
  });

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

  type SongSeed = {
    index: number;
    title: string;
    status: "FINISHED" | "DRAFT";
    lyrics: string;
    authorIndex: number;
    tagIndices: number[];
    /** When true, primary language row is French (otherwise Duala) */
    useFrench?: boolean;
  };

  const curatedSongs: SongSeed[] = [
    { index: 1, title: "Nya Loba", status: "FINISHED", lyrics: "Nya Loba, Nya Loba\nO mudi na bwam\nO mudi na bwam, Nya Loba\nNa sango na wé\n\nO ma pula mba na nyo\nO ma téyédi mba bunya\nNya Loba, Nya Loba\nNa tombédi wé", authorIndex: 0, tagIndices: [0, 1] },
    { index: 2, title: "Yesu Kristu", status: "FINISHED", lyrics: "Yesu Kristu, Mwané ma Loba\nO bé na bwam bwa bésé\nO pula mba na nyo\nNa tombédi wé na lèm la mba\n\nO bé Nanga na mba\nO bé Loba na mba\nYesu Kristu, a bwam bwa mba", authorIndex: 1, tagIndices: [0, 2] },
    { index: 3, title: "Hosana", status: "FINISHED", lyrics: "Hosana, Hosana\nNa kombo na Mulédi\nHosana na bulu ba kwédi\nHosana, Hosana\n\nA bé na nkémé\nA bé na ngéa\nMulédi ma bésé\nHosana, Hosana", authorIndex: 2, tagIndices: [1, 4] },
    { index: 4, title: "Loba a Bwam", status: "FINISHED", lyrics: "Loba a bwam, Loba a bwam\nNa tèmèdi na miso ma wé\nLoba a bwam, a bwam bwa bésé\nNa nyo na é, na bunya na é\n\nO mulema mwa mba mu tomba\nNa sé ma Loba a bwam\nNa lèm la bwam la wé", authorIndex: 0, tagIndices: [0, 6] },
    { index: 5, title: "Sango na Bwam", status: "FINISHED", lyrics: "Sango na bwam, sango na bwam\nNa sango na Yesu Kristu\nA bé na bwam bwa bésé\nA bé na bwam bwa bésé\n\nBana ba musango\nBana ba ndémbédi\nMiyéngédi ma Loba\nSango na bwam", authorIndex: 3, tagIndices: [1, 3, 6] },
    { index: 6, title: "Na Tombédi Wé", status: "DRAFT", lyrics: "Na tombédi wé, Nya Loba\nNa tombédi wé na lèm la mba\nNa tombédi wé\n\nO ma tèmbédi mba bunya\nO ma téyédi mba", authorIndex: 1, tagIndices: [0, 5] },
    { index: 7, title: "Bwam bwa Loba", status: "FINISHED", lyrics: "Bwam bwa Loba bu na mba\nBu na mba na bunya bwésé\nBwam bwa Loba\nBu na wé, bu na mba\n\nNa miso ma Loba\nNa lèm la Loba\nBwam bwa Loba bu na mba", authorIndex: 2, tagIndices: [2, 4, 6] },
    { index: 8, title: "Prière du Soir", status: "FINISHED", lyrics: "Dans le calme du soir\nJe viens vers toi, Seigneur\nMon coeur cherche ta paix\nTa lumière dans la nuit\n\nGuide mes pas demain\nProtège ceux que j'aime\nDans le calme du soir\nJe te confie ma vie", authorIndex: 3, tagIndices: [0, 5], useFrench: true },
    { index: 9, title: "Ndolo na Loba", status: "DRAFT", lyrics: "Ndolo na Loba\nNa mba a bé ndolo\nNdolo na Loba na bésé\n\nWé o si pula mba\nWé o si téyédi mba", authorIndex: 0, tagIndices: [7, 0] },
    { index: 10, title: "Alléluia Douala", status: "FINISHED", lyrics: "Alléluia, Alléluia\nNa kombo na Loba\nAlléluia, Alléluia\nNa kombo na Yesu\n\nBésé ba tomba\nBésé ba sanga\nAlléluia na bulu ba kwédi\nAlléluia, Alléluia", authorIndex: 1, tagIndices: [1, 4, 6] },
  ];

  /** Synthetic bulk hymns (indices 11–120) for search, pagination, and performance testing */
  const bulkTitles = [
    "Élévation", "Confiance", "Paix du matin", "Route du ciel", "Eau vive", "Lumière nouvelle", "Cœur reconnaissant",
    "Montagne sainte", "Rivière de grâce", "Porte étroite", "Berger fidèle", "Agneau vainqueur", "Colombe de paix",
    "Étoile du matin", "Rocher éternel", "Refuge sûr", "Fontaine jaillissante", "Vigne fertile", "Moisson joyeuse",
    "Moisson d’automne", "Printemps de foi", "Hiver de prière", "Été de louange", "Cloche du soir", "Cloche du matin",
    "Chœur des anges", "Voix du désert", "Chemin de Damas", "Galilée", "Bethléem", "Nazareth", "Jérusalem nouvelle",
    "Sion", "Oliviers", "Figuier", "Blé du champ", "Pain de vie", "Vin nouveau", "Coupe bénie", "Alliance",
    "Arc-en-ciel", "Arche stable", "Barque en tempête", "Calme après l’orage", "Aube grise", "Crépuscule doré",
    "Midi fervent", "Minuit sacré", "Veillée", "Veille de Noël", "Épiphanie", "Carême", "Pâques joyeuses",
    "Ascension", "Pentecôte", "Trinité", "Saint-Esprit descends", "Consolation", "Exhortation", "Intercession",
    "Supplication", "Action de grâce", "Gloria", "Kyrie", "Sanctus", "Agnus Dei", "Doxologie", "Amen final",
    "Ronde des enfants", "Chant des jeunes", "Chant des anciens", "Chant familial", "Chant missionnaire",
    "Chant d’envoi", "Chant d’entrée", "Offertoire simple", "Communion fraternelle", "Bénédiction pastorale",
    "Bénédiction nuptiale", "Funérailles — espérance", "Funérailles — paix", "Mariage — alliance", "Baptême — eau",
    "Confirmation — feu", "Ordination — appel", "Veillée de prière", "Réveil", "Réconciliation", "Pardon",
    "Miséricorde", "Justice et grâce", "Vérité", "Voie étroite", "Porte ouverte", "Maison du Père", "Table préparée",
    "Invité aux noces", "Robe blanche", "Couronne promise", "Palme de victoire", "Couronne d’épines", "Croix levée",
    "Tombeau vide", "Résurrection", "Vie éternelle", "Héritage", "Terre promise", "Cité céleste", "Nouvelle Jérusalem",
    "Rivière de vie", "Arbre de vie", "Lumière sans fin", "Fin des temps — gloire",
  ];

  const extraSongs: SongSeed[] = [];
  for (let index = 11; index <= 120; index++) {
    const titleBase = bulkTitles[(index - 11) % bulkTitles.length];
    const title = `${titleBase} (${index})`;
    const status: "FINISHED" | "DRAFT" = index % 25 === 0 ? "DRAFT" : "FINISHED";
    const authorIndex = (index - 1) % 4;
    const a = index % 8;
    const b = (index + 3) % 8;
    const tagIndices = a === b ? [a, (a + 1) % 8] : [a, b];
    const useFrench = index % 15 === 8;
    const lyrics = `${title}\n\nStrophe 1 — cantique numéro ${index}\nNous élevons notre voix vers le ciel\nEnsemble, frères et sœurs dans la foi\n\nRefrain:\nLouange au Seigneur, force de nos cœurs\nCantique ${index}, résonne au matin\n\nStrophe 2 — marche avec nous\nSur les chemins de Douala et d’ailleurs\nQue ce chant porte paix et vérité\n\nAmen — fin du cantique ${index}.`;
    extraSongs.push({
      index,
      title,
      status,
      lyrics,
      authorIndex,
      tagIndices,
      useFrench,
    });
  }

  const songsData: SongSeed[] = [...curatedSongs, ...extraSongs];

  for (const data of songsData) {
    const song = await prisma.song.upsert({
      where: { index: data.index },
      update: {},
      create: { index: data.index, title: data.title, status: data.status },
    });

    await prisma.songVersion.upsert({
      where: { songId_versionNumber: { songId: song.id, versionNumber: 1 } },
      update: {},
      create: { songId: song.id, versionType: "ORIGINAL", lyrics: data.lyrics, versionNumber: 1 },
    });

    await prisma.songAuthor.upsert({
      where: { songId_authorId: { songId: song.id, authorId: authors[data.authorIndex].id } },
      update: {},
      create: { songId: song.id, authorId: authors[data.authorIndex].id, displayOrder: 1 },
    });

    for (const tagIndex of data.tagIndices) {
      await prisma.songTag.upsert({
        where: { songId_tagId: { songId: song.id, tagId: tags[tagIndex].id } },
        update: {},
        create: { songId: song.id, tagId: tags[tagIndex].id },
      });
    }

    const langId = data.useFrench ? french.id : duala.id;
    await prisma.songLanguage.upsert({
      where: { songId_languageId: { songId: song.id, languageId: langId } },
      update: {},
      create: { songId: song.id, languageId: langId },
    });
  }

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

  // Collection
  const colSongs = await prisma.song.findMany({ where: { index: { in: [1, 2, 3, 5, 10] } } });
  const col = await prisma.collection.upsert({
    where: { id: "c1000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "c1000000-0000-0000-0000-000000000001",
      name: { fr: "Cantiques du Dimanche", en: "Sunday Hymns", duala: "Bejango ba Sonde" },
      description: { fr: "Les cantiques les plus chantés lors des cultes dominicaux", en: "The most sung hymns during Sunday worship", duala: "Bejango ba bato ba jangi na sonde" },
      isPublic: true,
      status: "PUBLIC",
      userId: admin.id,
    },
  });
  for (let i = 0; i < colSongs.length; i++) {
    await prisma.collectionSong.upsert({
      where: { collectionId_songId: { collectionId: col.id, songId: colSongs[i].id } },
      update: {},
      create: { collectionId: col.id, songId: colSongs[i].id, displayOrder: i },
    });
  }

  console.log(`Seed completed successfully: ${songsData.length} songs (indices 1–${songsData[songsData.length - 1]?.index ?? 0}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
