import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSongByParam } from "@/lib/data-provider";
import { getCurrentUser } from "@/lib/auth-helpers";
import { hymnSlides } from "@/lib/presentation";
import { Presenter } from "@/components/present/presenter";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("present");
  return { title: t("titleFor", { n: id }), robots: { index: false } };
}

export default async function PresentSongPage({ params, searchParams }: Props) {
  const [{ id }, { s }] = await Promise.all([params, searchParams]);
  const [song, user, t] = await Promise.all([getSongByParam(id), getCurrentUser(), getTranslations("present")]);
  if (!song || (song.status !== "FINISHED" && user?.role !== "ADMIN")) notFound();
  const version = song.versions[0];
  const stanzas = s?.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);

  const slides = version
    ? hymnSlides(
        { index: song.index, title: song.title, references: song.references, content: version.content },
        { refrain: t("refrain"), stanza: (n, total) => t("stanza", { n, total }) },
        { stanzas },
      )
    : [];

  return <Presenter slides={slides} exitHref={`/songs/${song.index}`} title={`${song.index}. ${song.title}`} />;
}
