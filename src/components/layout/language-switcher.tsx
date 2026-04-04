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

const shortLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  duala: "DU",
};

type LanguageSwitcherProps = {
  /** Abbreviated buttons (e.g. admin header on narrow screens) */
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const router = useRouter();

  const switchLocale = (locale: Locale) => {
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  const show = compact ? shortLabels : labels;
  const btnClass = compact
    ? "px-2 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-[var(--font-ui)] transition-colors bg-transparent border-none cursor-pointer"
    : "px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-medium font-[var(--font-ui)] transition-colors bg-transparent border-none cursor-pointer";

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      <Globe size={compact ? 12 : 14} className="text-[var(--color-text-muted)] shrink-0" aria-hidden />
      <div className="flex items-center gap-0.5 sm:gap-1">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => switchLocale(locale)}
            className={`${btnClass} ${
              currentLocale === locale
                ? "bg-[var(--color-green-light)] text-[var(--color-forest)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-deep)] hover:bg-[var(--color-sand)]"
            }`}
          >
            {show[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
