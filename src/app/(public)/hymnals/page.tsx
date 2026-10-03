import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getHymnals } from "@/lib/data-provider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hymnals");
  return { title: t("title"), description: t("intro") };
}

/** Legend of the abbreviations printed under each hymn number. */
export default async function HymnalsPage() {
  const [t, hymnals] = await Promise.all([getTranslations("hymnals"), getHymnals()]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-[28px] text-deep m-0 mb-2">{t("title")}</h1>
      <p className="text-[14px] text-green-muted mb-8 max-w-xl leading-relaxed">{t("intro")}</p>

      {hymnals.length === 0 ? (
        <p className="text-[14px] text-text-muted bg-linen rounded-[var(--radius-md)] p-6">{t("empty")}</p>
      ) : (
        <dl className="m-0 border-[0.5px] border-stone rounded-[var(--radius-lg)] divide-y-[0.5px] divide-stone overflow-hidden">
          {hymnals.map((h) => (
            <div key={h.id} id={h.code} className="grid sm:grid-cols-[9rem_1fr] gap-x-6 gap-y-1 px-4 py-4 bg-parchment target:bg-amber-light scroll-mt-20">
              <dt className="font-display text-[19px] text-deep">{h.code}</dt>
              <dd className="m-0">
                <p className="m-0 text-[15px] text-text-body">{h.name}</p>
                {h.description && <p className="m-0 mt-1 text-[13px] text-text-muted leading-relaxed">{h.description}</p>}
                {h.songCount > 0 && (
                  <Link href={`/songs?hymnal=${encodeURIComponent(h.code)}`} className="inline-block mt-1.5 text-[12px] text-forest">
                    {t("songCount", { count: h.songCount })}
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
