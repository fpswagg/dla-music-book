import type { Locale } from "@/i18n/config";

/** Remembers the interface language for a year (read by src/i18n/request.ts). */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
