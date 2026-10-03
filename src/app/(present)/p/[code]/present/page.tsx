import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSetlist } from "@/lib/setlists";
import { getCurrentUser } from "@/lib/auth-helpers";
import { hymnSlides, type Slide } from "@/lib/presentation";
import { Presenter } from "@/components/present/presenter";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { robots: { index: false } };

/** Projects a whole service programme, hymn after hymn. */
export default async function PresentProgrammePage({ params }: Props) {
  const { code } = await params;
  const [setlist, user, t] = await Promise.all([getSetlist({ code }), getCurrentUser(), getTranslations("present")]);
  if (!setlist || (!setlist.shared && setlist.ownerId !== user?.id)) notFound();

  const labels = { refrain: t("refrain"), stanza: (n: number, total: number) => t("stanza", { n, total }) };
  const slides: Slide[] = setlist.items.flatMap((it, i): Slide[] => {
    if (it.song) return hymnSlides(it.song, labels, { stanzas: it.stanzas, label: it.label });
    if (it.label || it.note) return [{ key: `m${i}`, kind: "label", kicker: "", lines: [it.label ?? "", it.note ?? ""].filter(Boolean) }];
    return [];
  });

  return <Presenter slides={slides} exitHref={`/p/${setlist.code}`} title={setlist.title} />;
}
