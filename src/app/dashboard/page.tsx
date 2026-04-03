import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Heart } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("title")}</h1>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{t("myCollections")}</SectionLabel>
          <Link href="/dashboard/collections/new">
            <Button size="sm" variant="secondary"><Plus size={14} /> {t("newCollection")}</Button>
          </Link>
        </div>
        <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-8 text-center">
          <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {t("noCollections")}
          </p>
        </div>
      </div>

      <div>
        <SectionLabel>{t("likedSongs")}</SectionLabel>
        <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-8 text-center">
          <Heart size={24} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {t("noLikes")}
          </p>
        </div>
      </div>
    </div>
  );
}
