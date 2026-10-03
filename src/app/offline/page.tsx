import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OfflineReader } from "@/components/offline/offline-reader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("readerTitle"), robots: { index: false } };
}

/** Works without network: hymns come from the bundle saved in the browser. */
export default function OfflinePage() {
  return <OfflineReader />;
}
