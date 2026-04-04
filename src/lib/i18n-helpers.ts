import { defaultLocale } from "@/i18n/config";

type TranslatedField = Record<string, string> | string;

export function getTranslatedName(json: TranslatedField, locale: string): string {
  if (typeof json === "string") return json;
  return json[locale] ?? json[defaultLocale] ?? json["fr"] ?? Object.values(json)[0] ?? "";
}

export function createTranslatedField(
  value: string,
  locale: string
): Record<string, string> {
  return { [locale]: value };
}
