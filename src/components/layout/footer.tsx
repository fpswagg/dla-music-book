import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="no-print border-t-[0.5px] border-t-[var(--color-stone)] bg-[var(--color-linen)] py-6">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
          {t("description")}
        </p>
      </div>
    </footer>
  );
}
