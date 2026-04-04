import Link from "next/link";
import { Music } from "lucide-react";
import { MockBanner } from "@/components/ui/mock-banner";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function Header() {
  const t = await getTranslations("nav");
  const tb = await getTranslations("brand");
  const user = await getCurrentUser();
  const userProp = user
    ? { displayName: user.displayName, role: user.role }
    : null;

  const navLinksDesktop = (
    <>
      <Link
        href="/songs"
        className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors"
      >
        {t("songs")}
      </Link>
      <Link
        href="/collections"
        className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors"
      >
        {t("collections")}
      </Link>
      <UserMenu user={userProp} variant="desktop" />
    </>
  );

  const navLinksMobile = (
    <>
      <Link
        href="/songs"
        className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors py-1"
      >
        {t("songs")}
      </Link>
      <Link
        href="/collections"
        className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] no-underline hover:text-[var(--color-deep)] transition-colors py-1"
      >
        {t("collections")}
      </Link>
      <UserMenu user={userProp} variant="mobile" />
    </>
  );

  return (
    <>
      <MockBanner />
      <header className="no-print border-b-[0.5px] border-b-[var(--color-stone)] bg-[var(--color-linen)] relative">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Music size={20} className="text-[var(--color-forest)]" />
            <span className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)]">
              {tb("name")}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navLinksDesktop}
          </nav>
          <MobileNav>{navLinksMobile}</MobileNav>
        </div>
      </header>
    </>
  );
}
