import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/config";
import { HomeGoTo, HomeSearch, RecentHymns } from "@/components/home/home-goto";

export async function generateMetadata(): Promise<Metadata> {
  const tm = await getTranslations("meta");
  return { title: { absolute: tm("title") }, description: tm("description"), openGraph: { url: getSiteUrl(), type: "website" } };
}

/** The book's front page: a number, a search, the last hymns opened. Everything else is one tap away in the menu. */
export default async function HomePage() {
  const [t, tb] = await Promise.all([getTranslations("home"), getTranslations("brand")]);
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

  return (
    <div className="max-w-md mx-auto px-6 pt-[10vh] pb-16 flex flex-col items-center text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="font-display text-[30px] sm:text-[36px] text-deep m-0 leading-tight">{t("title")}</h1>
      <p className="text-[14px] text-text-muted mt-2 mb-0">{t("tagline")}</p>

      <div className="w-full mt-14">
        <HomeGoTo />
      </div>

      <div className="w-full mt-8">
        <HomeSearch />
      </div>

      <div className="w-full mt-12 min-h-[3rem]">
        <RecentHymns />
      </div>

      <Link href="/songs" className="mt-6 text-[13px] text-green-muted no-underline hover:text-deep">
        {t("browseAll")} →
      </Link>
    </div>
  );
}
