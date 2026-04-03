import Link from "next/link";
import { getPublicCollections } from "@/lib/data-provider";
import { getTranslations } from "next-intl/server";

export default async function CollectionsPage() {
  const t = await getTranslations("collections");
  const collections = await getPublicCollections();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("title")}
      </h1>

      {collections.length === 0 ? (
        <p className="text-[14px] text-[var(--color-text-muted)] font-[var(--font-ui)] text-center py-16">
          {t("noPublicCollections")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link key={col.id} href={`/collections/${col.id}`} className="no-underline">
              <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--color-green-muted)] transition-colors">
                <h3 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-2 line-clamp-2">
                    {col.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                    {t("songsCount", { count: col._count?.collectionSongs ?? 0 })}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                    {t("by", { author: col.user?.displayName ?? t("unknown") })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
