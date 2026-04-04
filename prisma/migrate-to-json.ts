import { PrismaClient } from "@prisma/client";

/**
 * One-time migration: convert String name columns to Json,
 * add Tag.key from existing name values.
 * 
 * Run with: npx tsx prisma/migrate-to-json.ts
 */

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration to JSON name fields...\n");

  // Step 1: Add `key` column to Tag, populated from existing `name`
  console.log("1. Adding Tag.key column...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "key" TEXT`);
    await prisma.$executeRawUnsafe(`UPDATE "Tag" SET "key" = "name" WHERE "key" IS NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tag" ALTER COLUMN "key" SET NOT NULL`);
    // Drop old unique on name if it exists, add unique on key
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_name_key"`);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tag_key_key') THEN
          ALTER TABLE "Tag" ADD CONSTRAINT "Tag_key_key" UNIQUE ("key");
        END IF;
      END $$
    `);
    console.log("   Done.\n");
  } catch (e) {
    console.log("   Tag.key already exists or error:", (e as Error).message, "\n");
  }

  // Step 2: Convert Tag.name from text to jsonb
  console.log("2. Converting Tag.name to jsonb...");
  try {
    // Build JSON from the old string value: {"fr": oldName, "en": oldName}
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Tag" ALTER COLUMN "name" TYPE jsonb
      USING jsonb_build_object('fr', "name", 'en', "name", 'duala', "name")
    `);
    console.log("   Done.\n");
  } catch (e) {
    console.log("   Already jsonb or error:", (e as Error).message, "\n");
  }

  // Step 3: Convert Language.name from text to jsonb
  console.log("3. Converting Language.name to jsonb...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Language" ALTER COLUMN "name" TYPE jsonb
      USING jsonb_build_object('fr', "name", 'en', "name", 'duala', "name")
    `);
    console.log("   Done.\n");
  } catch (e) {
    console.log("   Already jsonb or error:", (e as Error).message, "\n");
  }

  // Step 4: Convert Collection.name from text to jsonb
  console.log("4. Converting Collection.name to jsonb...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Collection" ALTER COLUMN "name" TYPE jsonb
      USING jsonb_build_object('fr', "name", 'en', "name", 'duala', "name")
    `);
    console.log("   Done.\n");
  } catch (e) {
    console.log("   Already jsonb or error:", (e as Error).message, "\n");
  }

  // Step 5: Convert Collection.description from text to jsonb
  console.log("5. Converting Collection.description to jsonb...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Collection" ALTER COLUMN "description" TYPE jsonb
      USING CASE
        WHEN "description" IS NOT NULL THEN jsonb_build_object('fr', "description", 'en', "description", 'duala', "description")
        ELSE NULL
      END
    `);
    console.log("   Done.\n");
  } catch (e) {
    console.log("   Already jsonb or error:", (e as Error).message, "\n");
  }

  // Step 6: Now update Tag names with proper translations
  console.log("6. Updating Tag names with proper translations...");
  const tagTranslations: Record<string, Record<string, string>> = {
    spiritual: { fr: "Spirituel", en: "Spiritual", duala: "Mudi" },
    praise: { fr: "Louange", en: "Praise", duala: "Tombédi" },
    worship: { fr: "Adoration", en: "Worship", duala: "Nyamsi" },
    storytelling: { fr: "Récit", en: "Storytelling", duala: "Musango" },
    joyful: { fr: "Joyeux", en: "Joyful", duala: "Bisima" },
    solemn: { fr: "Solennel", en: "Solemn", duala: "Nkémé" },
    traditional: { fr: "Traditionnel", en: "Traditional", duala: "Mbassa" },
    love: { fr: "Amour", en: "Love", duala: "Ndolo" },
  };

  for (const [key, names] of Object.entries(tagTranslations)) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Tag" SET "name" = $1::jsonb WHERE "key" = $2`,
      JSON.stringify(names),
      key
    );
  }
  console.log("   Done.\n");

  // Step 7: Update Language names with proper translations
  console.log("7. Updating Language names with proper translations...");
  const langTranslations: Record<string, Record<string, string>> = {
    duala: { fr: "Duala", en: "Duala", duala: "Duala" },
    fr: { fr: "Français", en: "French", duala: "Frañse" },
    en: { fr: "Anglais", en: "English", duala: "Anglis" },
  };

  for (const [code, names] of Object.entries(langTranslations)) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Language" SET "name" = $1::jsonb WHERE "code" = $2`,
      JSON.stringify(names),
      code
    );
  }
  console.log("   Done.\n");

  console.log("Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
