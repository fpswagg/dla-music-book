import { notFound } from "next/navigation";
import { getSongById, getAuthors, getTags, getLanguages } from "@/lib/data-provider";
import { SongEditForm } from "@/components/admin/song-edit-form";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditSongPage({ params }: Props) {
  const { id } = await params;
  const [song, t, authors, tags, languages] = await Promise.all([
    getSongById(id),
    getTranslations("admin"),
    getAuthors(),
    getTags(),
    getLanguages(),
  ]);
  if (!song) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("editSong", { title: song.title })}
      </h1>
      <SongEditForm song={song} allAuthors={authors} allTags={tags} allLanguages={languages} />
    </div>
  );
}
