import { getTags } from "@/lib/data-provider";
import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { getTranslations } from "next-intl/server";

export default async function AdminTagsPage() {
  const t = await getTranslations("admin");
  const tags = await getTags();
  const grouped = tags.reduce((acc, tag) => {
    const cat = tag.category || "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("tags")}</h1>
      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category} className="mb-6">
          <SectionLabel>{category}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map(tag => (
              <Tag key={tag.id} label={tag.name} variant={category === "MOOD" ? "mood" : "keyword"} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
