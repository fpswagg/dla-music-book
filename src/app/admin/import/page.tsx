import { getHymnals } from "@/lib/data-provider";
import { prisma } from "@/lib/prisma";
import { BookImport } from "@/components/admin/book-import";

export default async function AdminImportPage() {
  const [hymnals, existing] = await Promise.all([
    getHymnals(),
    prisma ? prisma.song.findMany({ select: { index: true } }) : Promise.resolve([] as Array<{ index: number }>),
  ]);
  return <BookImport hymnals={hymnals} existingIndexes={existing.map((s) => s.index)} />;
}
