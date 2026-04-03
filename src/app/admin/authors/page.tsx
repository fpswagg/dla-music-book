import { getAuthors } from "@/lib/data-provider";
import { SectionLabel } from "@/components/ui/section-label";
import { getTranslations } from "next-intl/server";

export default async function AdminAuthorsPage() {
  const t = await getTranslations("admin");
  const authors = await getAuthors();

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("authors")}</h1>
      <SectionLabel>{t("authorsCount", { count: authors.length })}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {authors.map(author => (
          <div key={author.id} className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4">
            <h3 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">{author.name}</h3>
            {author.bio && <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)]">{author.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
