import { notFound } from "next/navigation";
import { getSongById } from "@/lib/data-provider";
import { SongEditForm } from "@/components/admin/song-edit-form";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditSongPage({ params }: Props) {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) notFound();

  const t = await getTranslations("admin");

  return (
    <div className="max-w-2xl">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("editSong", { title: song.title })}
      </h1>
      <SongEditForm song={song} />
    </div>
  );
}
