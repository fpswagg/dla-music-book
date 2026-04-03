import { getAppMode } from "@/lib/env";
import { getTranslations } from "next-intl/server";

export async function MockBanner() {
  const mode = getAppMode();
  if (mode === "full") return null;

  const t = await getTranslations("mock");

  return (
    <div className="bg-[var(--color-amber-light)] border-b-[0.5px] border-b-[var(--color-amber)] px-4 py-2 text-center">
      <span className="text-[12px] text-[var(--color-amber)] font-[var(--font-ui)]">
        {mode === "mock" ? t("banner") : t("bannerDbOnly")}
      </span>
    </div>
  );
}
