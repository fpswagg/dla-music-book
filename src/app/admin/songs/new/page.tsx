import { getTranslations } from "next-intl/server";
import { getAuthors, getHymnals, getLanguages, getTags } from "@/lib/data-provider";
import { prisma } from "@/lib/prisma";
import { SongEditForm } from "@/components/admin/song-edit-form";

export default async function NewSongPage() {
  const [t, authors, tags, languages, hymnals, last] = await Promise.all([
    getTranslations("admin"),
    getAuthors(),
    getTags(),
    getLanguages(),
    getHymnals(),
    prisma?.song.findFirst({ orderBy: { index: "desc" }, select: { index: true } }),
  ]);
  return (
    <div className="max-w-5xl">
      <h1 className="text-[28px] text-deep font-display mb-6">{t("addSong")}</h1>
      <SongEditForm song={null} nextIndex={(last?.index ?? 0) + 1} allAuthors={authors} allTags={tags} allLanguages={languages} hymnals={hymnals} />
    </div>
  );
}
