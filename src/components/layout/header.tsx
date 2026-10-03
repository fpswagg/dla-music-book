import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MockBanner } from "@/components/ui/mock-banner";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GoToHymn } from "@/components/songs/goto-hymn";
import { ReadingSettings } from "@/components/settings/reading-settings";
import { getCurrentUser } from "@/lib/auth-helpers";

const linkClass =
  "text-[13px] text-text-body font-ui no-underline hover:text-deep transition-colors";

export async function Header() {
  const [t, tb, user] = await Promise.all([getTranslations("nav"), getTranslations("brand"), getCurrentUser()]);
  const userProp = user ? { displayName: user.displayName, role: user.role } : null;

  const links = [
    { href: "/songs", label: t("songs") },
    { href: "/collections", label: t("collections") },
    { href: "/hymnals", label: t("hymnals") },
  ];

  return (
    <>
      <MockBanner />
      <header className="no-print sticky top-0 z-40 border-b-[0.5px] border-b-stone bg-linen pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 no-underline min-w-0 mr-auto">
            <BookOpen size={20} className="text-forest shrink-0" aria-hidden />
            <span className="text-[17px] sm:text-[19px] text-deep font-display truncate">{tb("name")}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 mr-3" aria-label={t("siteNavigation")}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </nav>
          <GoToHymn />
          <ReadingSettings />
          <div className="hidden md:flex items-center">
            <UserMenu user={userProp} variant="desktop" />
          </div>
          <MobileNav>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`${linkClass} py-2.5 px-3 rounded-[var(--radius-sm)] hover:bg-sand`}>
                {l.label}
              </Link>
            ))}
            <UserMenu user={userProp} variant="mobile" />
          </MobileNav>
        </div>
      </header>
    </>
  );
}
