import { getPublicCollections } from "@/lib/data-provider";
import { SectionLabel } from "@/components/ui/section-label";
import { getTranslations } from "next-intl/server";

export default async function AdminCollectionsPage() {
  const t = await getTranslations("admin");
  const collections = await getPublicCollections();

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("collections")}</h1>
      <SectionLabel>{t("collectionsCount", { count: collections.length })}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {collections.map(col => (
          <div key={col.id} className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4">
            <h3 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">{col.name}</h3>
            <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)]">{col._count?.collectionSongs ?? 0} {t("songs").toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
