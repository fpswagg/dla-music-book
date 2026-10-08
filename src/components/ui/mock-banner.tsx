import { getTranslations } from "next-intl/server";
import { isMockMode } from "@/lib/config";

/**
 * Demo mode (no database): say it, don't hide it. "Sign-in not configured" is a setup detail: the
 * sign-in page explains it, the public pages stay clean.
 */
export async function MockBanner() {
  if (!isMockMode()) return null;
  const t = await getTranslations("mock");
  return (
    <div className="no-print bg-amber-light border-b-[0.5px] border-b-amber px-4 py-2 text-center">
      <span className="text-[12px] text-amber font-ui">{t("banner")}</span>
    </div>
  );
}
