import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function Footer() {
  const t = await getTranslations("footer");
  const tb = await getTranslations("brand");

  return (
    <footer className="no-print border-t-[0.5px] border-t-[var(--color-stone)] bg-[var(--color-linen)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-4">
        <div className="min-w-0 hidden md:block">
          <p className="text-[13px] text-[var(--color-deep)] font-[var(--font-display)] m-0 leading-tight">
            {tb("name")}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] mt-0.5 m-0 leading-snug line-clamp-2">
            {t("description")}
          </p>
        </div>
        <div className="shrink-0 flex w-full justify-center md:w-auto md:justify-end">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
