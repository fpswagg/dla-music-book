"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";

export type TranslatedStrings = { fr: string; en: string; duala: string };

const LOCALES: Locale[] = ["fr", "en", "duala"];

type TranslatedTextFieldProps = {
  id?: string;
  label?: string;
  value: TranslatedStrings;
  onChange: (next: TranslatedStrings) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  /** When set, placeholder follows the active locale (recommended). */
  placeholderForLocale?: (locale: Locale) => string;
  className?: string;
  /** Short labels for locale pills (i18n) */
  localeLabels: Record<Locale, string>;
  /** Shown under the pills — which locale is being edited */
  editingHint: (locale: Locale) => string;
  /** Accessible label for the locale switcher */
  pickerLabel: string;
};

export function TranslatedTextField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  placeholderForLocale,
  className = "",
  localeLabels,
  editingHint,
  pickerLabel,
}: TranslatedTextFieldProps) {
  const [active, setActive] = useState<Locale>("fr");

  const setField = (locale: Locale, text: string) => {
    onChange({ ...value, [locale]: text });
  };

  const activePlaceholder = placeholderForLocale
    ? placeholderForLocale(active)
    : placeholder;

  const inputCls =
    "w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13px] text-[var(--color-deep)] font-[var(--font-ui)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-forest)] focus:bg-[var(--color-parchment)]";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
          {label}
        </span>
      )}
      <div
        className="flex flex-wrap gap-1 p-0.5 bg-[var(--color-sand)] rounded-[var(--radius-md)] border-[0.5px] border-[var(--color-stone)] w-fit max-w-full"
        role="tablist"
        aria-label={pickerLabel}
      >
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            role="tab"
            aria-selected={active === loc}
            onClick={() => setActive(loc)}
            className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium font-[var(--font-ui)] border-none cursor-pointer transition-colors ${
              active === loc
                ? "bg-[var(--color-forest)] text-[var(--color-parchment)]"
                : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-deep)]"
            }`}
          >
            {localeLabels[loc]}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0">
        {editingHint(active)}
      </p>
      {multiline ? (
        <textarea
          id={id}
          value={value[active]}
          onChange={(e) => setField(active, e.target.value)}
          rows={rows}
          placeholder={activePlaceholder}
          className={`${inputCls} resize-y min-h-[60px] font-[var(--font-ui)]`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value[active]}
          onChange={(e) => setField(active, e.target.value)}
          placeholder={activePlaceholder}
          className={inputCls}
        />
      )}
    </div>
  );
}
