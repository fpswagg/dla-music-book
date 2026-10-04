import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GoToButton } from "@/components/songs/goto-button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <p className="font-display text-[64px] leading-none text-stone m-0">404</p>
          <h1 className="font-display text-[24px] text-deep mt-4 mb-2">{t("title")}</h1>
          <p className="text-[14px] text-text-muted mb-6">{t("text")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <GoToButton label={t("goto")} />
            <Link href="/songs" className="inline-flex items-center min-h-[40px] px-4 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[13px] text-deep no-underline hover:bg-sand">
              {t("browse")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
