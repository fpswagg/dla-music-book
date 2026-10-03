import { getTranslations } from "next-intl/server";
import { isAuthConfigured, isMockMode } from "@/lib/config";

/** Demo mode (no database) or sign-in not configured: say it, don't hide it. */
export async function MockBanner() {
  const demo = isMockMode();
  if (!demo && isAuthConfigured()) return null;
  const t = await getTranslations("mock");
  return (
    <div className="no-print bg-amber-light border-b-[0.5px] border-b-amber px-4 py-2 text-center">
      <span className="text-[12px] text-amber font-ui">{demo ? t("banner") : t("bannerNoAuth")}</span>
    </div>
  );
}
