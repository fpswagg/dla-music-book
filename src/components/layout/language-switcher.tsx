"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  duala: "DU",
};

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();

  const switchLocale = (locale: Locale) => {
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-0.5">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium font-[var(--font-ui)] transition-colors bg-transparent border-none cursor-pointer ${
            currentLocale === locale
              ? "text-[var(--color-deep)] bg-[var(--color-sand)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-deep)] hover:bg-[var(--color-sand)]"
          }`}
        >
          {labels[locale]}
        </button>
      ))}
    </div>
  );
}
