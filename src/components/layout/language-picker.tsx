"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  duala: "Duala",
};

const titles: Record<Locale, string> = {
  fr: "Parcourir en français",
  en: "Browse in English",
  duala: "Na Duala",
};

export function LanguagePicker() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const selectLocale = (locale: Locale) => {
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <Globe size={14} className="text-[var(--color-text-muted)] shrink-0" aria-hidden />
      <div className="flex items-center gap-1.5 sm:gap-1 flex-wrap justify-center">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            title={titles[locale]}
            onClick={() => selectLocale(locale)}
            className={`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-[var(--radius-pill)] text-[12px] font-medium font-[var(--font-ui)] transition-colors bg-transparent border-none cursor-pointer inline-flex items-center justify-center ${
              currentLocale === locale
                ? "bg-[var(--color-green-light)] text-[var(--color-forest)] ring-1 ring-[var(--color-forest)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-deep)] hover:bg-[var(--color-sand)]"
            }`}
          >
            {labels[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
