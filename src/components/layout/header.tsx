import Link from "next/link";
import { Music, User } from "lucide-react";
import { MockBanner } from "@/components/ui/mock-banner";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getTranslations } from "next-intl/server";

export async function Header() {
  const t = await getTranslations("nav");

  return (
    <>
      <MockBanner />
      <header className="no-print border-b-[0.5px] border-b-[var(--color-stone)] bg-[var(--color-linen)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Music size={20} className="text-[var(--color-forest)]" />
            <span className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)]">
              Douala Hymn Book
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/songs" className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors">
              {t("songs")}
            </Link>
            <Link href="/collections" className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors">
              {t("collections")}
            </Link>
            <LanguageSwitcher />
            <Link href="/auth/login" className="flex items-center gap-1.5 text-[13px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline">
              <User size={16} />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
