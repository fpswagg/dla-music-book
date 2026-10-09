import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isValidLocale } from "./config";

type Messages = { [key: string]: string | Messages };

/** Fill every key missing from `target` with the fallback's value (deep). */
function withFallback(target: Messages, fallback: Messages): Messages {
  const out: Messages = { ...fallback };
  for (const [key, value] of Object.entries(target)) {
    const base = out[key];
    out[key] =
      typeof value === "object" && typeof base === "object" ? withFallback(value, base) : value;
  }
  return out;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("locale")?.value;
  const locale = raw && isValidLocale(raw) ? raw : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default as Messages;
  if (locale === defaultLocale) return { locale, messages };

  // Untranslated keys show the default language instead of a missing-message error.
  const base = (await import(`./messages/${defaultLocale}.json`)).default as Messages;
  return { locale, messages: withFallback(messages, base) };
});
