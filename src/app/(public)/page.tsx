import { LanguagePicker } from "@/components/layout/language-picker";
import { HomeSearchCta } from "@/components/layout/home-search-cta";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/env";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = getSiteUrl();
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      url: siteUrl,
      type: "website",
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tb = await getTranslations("brand");
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
    <div className="max-w-6xl mx-auto px-4 sm:px-4 py-8 sm:py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col items-center w-full">
        {/* Mobile: title & search first; md+: language row first (unchanged desktop order) */}
        <div className="flex flex-col items-center gap-5 sm:gap-6 text-center order-1 md:order-2 mb-8 md:mb-0 w-full">
          <h1 className="text-[28px] sm:text-[32px] md:text-[40px] text-[var(--color-deep)] font-[var(--font-display)] m-0 leading-tight px-1 text-balance">
            {t("title")}
          </h1>
          <p className="text-[15px] text-[var(--color-green-muted)] font-[var(--font-ui)] max-w-md m-0 leading-relaxed px-1">
            {t("subtitle")}
          </p>
          <HomeSearchCta />
        </div>

        <div className="hidden md:flex flex-col items-center gap-3 w-full order-2 md:order-1 md:mb-10">
          <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)] m-0">
            {t("chooseLanguage")}
          </p>
          <LanguagePicker />
        </div>
      </div>
    </div>
  );
}
