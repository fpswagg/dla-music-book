import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookMarked, Library, ListMusic, Search, WifiOff } from "lucide-react";
import { getSiteUrl } from "@/lib/config";
import { getStats } from "@/lib/data-provider";
import { HomeSearchCta } from "@/components/layout/home-search-cta";
import { LanguagePicker } from "@/components/layout/language-picker";
import { HomeGoTo, RecentHymns } from "@/components/home/home-goto";

export async function generateMetadata(): Promise<Metadata> {
  const tm = await getTranslations("meta");
  return { title: { absolute: tm("title") }, description: tm("description"), openGraph: { url: getSiteUrl(), type: "website" } };
}

export default async function HomePage() {
  const [t, tb, stats] = await Promise.all([getTranslations("home"), getTranslations("brand"), getStats()]);
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: tb("name"),
    url: siteUrl,
    description: t("subtitle"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/songs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const tiles = [
    { href: "/songs", icon: Search, title: t("tileAll"), text: t("tileAllText", { count: stats.finishedSongs }) },
    { href: "/dashboard/programmes", icon: ListMusic, title: t("tileProgrammes"), text: t("tileProgrammesText") },
    { href: "/collections", icon: Library, title: t("tileCollections"), text: t("tileCollectionsText") },
    { href: "/hymnals", icon: BookMarked, title: t("tileHymnals"), text: t("tileHymnalsText") },
    { href: "/offline", icon: WifiOff, title: t("tileOffline"), text: t("tileOfflineText") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <h1 className="text-[34px] sm:text-[42px] md:text-[50px] text-deep font-display m-0 leading-[1.1] text-balance">{t("title")}</h1>
        <p className="text-[15px] sm:text-[16px] text-green-muted m-0 max-w-lg leading-relaxed">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col items-center gap-6 mb-12">
        <HomeGoTo />
        <div className="w-full max-w-xl">
          <HomeSearchCta />
        </div>
      </div>

      <div className="mb-12">
        <RecentHymns />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex gap-3 items-start p-4 bg-linen rounded-[var(--radius-lg)] border-[0.5px] border-transparent hover:border-stone no-underline transition-colors">
            <Icon size={20} className="text-forest shrink-0 mt-0.5" aria-hidden />
            <span>
              <span className="block font-display text-[17px] text-deep">{title}</span>
              <span className="block text-[13px] text-text-muted mt-0.5">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0">{t("chooseLanguage")}</p>
        <LanguagePicker />
      </div>
    </div>
  );
}
