import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSetlist } from "@/lib/setlists";
import { getSiteUrl } from "@/lib/config";
import { BackLink } from "@/components/ui/back-link";
import { ProgrammeEditor } from "@/components/setlists/programme-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("programmes");
  return { title: t("edit") };
}

export default async function ProgrammeEditPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?redirect=/dashboard/programmes/${id}`);
  const [setlist, t] = await Promise.all([getSetlist({ id }), getTranslations("programmes")]);
  if (!setlist || setlist.ownerId !== user.id) notFound();

  return (
    <div className="max-w-3xl">
      <BackLink href="/dashboard/programmes" label={t("title")} />
      <ProgrammeEditor
        initial={{
          id: setlist.id,
          code: setlist.code,
          title: setlist.title,
          date: setlist.date,
          notes: setlist.notes,
          shared: setlist.shared,
          items: setlist.items.map((it) => ({
            key: it.id,
            label: it.label ?? "",
            note: it.note ?? "",
            stanzas: it.stanzas,
            song: it.song ? { id: it.song.id, index: it.song.index, title: it.song.title, stanzaNumbers: it.song.stanzaNumbers } : null,
          })),
        }}
        shareBase={`${getSiteUrl()}/p/`}
      />
    </div>
  );
}
