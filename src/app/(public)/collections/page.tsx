import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { getPublicCollections } from "@/lib/data-provider";
import { getTranslations, getLocale } from "next-intl/server";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { CollectionsSearchClient } from "@/components/collections/collections-search-client";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const [t, tm] = await Promise.all([getTranslations("collections"), getTranslations("meta")]);
  return {
    title: t("title"),
    description: tm("description"),
  };
}

export default async function CollectionsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations("collections");
  const locale = await getLocale();
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { collections, total } = await getPublicCollections({
    q: q || undefined,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("title")}
      </h1>

      <CollectionsSearchClient initialQ={q} />

      {collections.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <FolderOpen size={32} className="text-[var(--color-stone)] mb-3" />
          <p className="text-[14px] text-[var(--color-text-muted)] font-[var(--font-ui)] text-center">
            {t("noPublicCollections")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <Link key={col.id} href={`/collections/${col.id}`} className="no-underline">
                <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--color-green-muted)] transition-colors">
                  <h3 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">
                    {getTranslatedName(col.name as Record<string, string>, locale)}
                  </h3>
                  {col.description ? (
                    <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-2 line-clamp-2">
                      {getTranslatedName(col.description as Record<string, string>, locale)}
                    </p>
                  ) : null}
                  <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                    {t("songsCount", { count: col._count?.collectionSongs ?? 0 })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            pathname="/collections"
            searchParams={searchParams}
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
