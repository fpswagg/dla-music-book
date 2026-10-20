import { getSongTuneHelp } from "@/lib/tune-suggestions";
import { prisma } from "@/lib/prisma";
import { SongTunePanel } from "@/components/admin/song-tune-panel";
import { notFound } from "next/navigation";
import { getAuthors, getHymnals, getLanguages, getSongById, getTags } from "@/lib/data-provider";
import { SongEditForm } from "@/components/admin/song-edit-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditSongPage({ params }: Props) {
  const { id } = await params;
  const [song, authors, tags, languages, hymnals] = await Promise.all([
    getSongById(id),
    getAuthors(),
    getTags(),
    getLanguages(),
    getHymnals(),
  ]);
  if (!song) notFound();
  const help = await getSongTuneHelp(song.id);
  const current = help?.song.tuneId && prisma
    ? await prisma.tune.findUnique({ where: { id: help.song.tuneId }, select: { id: true, name: true, _count: { select: { scores: true } } } })
    : null;

  return (
    <div className="max-w-5xl">
      <h1 className="text-[26px] text-deep font-display mb-6">
        <span className="text-stone mr-2">{song.index}</span>
        {song.title}
      </h1>
      <SongEditForm song={song} allAuthors={authors} allTags={tags} allLanguages={languages} hymnals={hymnals} />
      {help && <SongTunePanel help={help} current={current ? { id: current.id, name: current.name, scores: current._count.scores } : null} />}
    </div>
  );
}
