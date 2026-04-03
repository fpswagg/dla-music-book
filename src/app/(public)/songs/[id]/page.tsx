import { notFound } from "next/navigation";
import { getSongById } from "@/lib/data-provider";
import { Tag } from "@/components/ui/tag";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnnotationBlock } from "@/components/ui/annotation-block";
import { SectionLabel } from "@/components/ui/section-label";
import { SongDetailClient } from "@/components/songs/song-detail-client";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await getSongById(id);
  const t = await getTranslations("song");
  if (!song) return { title: t("notFound") };
  const firstLines = song.versions[0]?.lyrics.split("\n").slice(0, 2).join(" · ") ?? "";
  return {
    title: `${song.index}. ${song.title} — ${t("titleSuffix")}`,
    description: `${firstLines} — ${song.authors.map((a) => a.name).join(", ")}`,
    openGraph: {
      title: `${song.index}. ${song.title}`,
      description: `${firstLines} — ${song.authors.map((a) => a.name).join(", ")}`,
      type: "music.song",
    },
  };
}

export default async function SongDetailPage({ params }: Props) {
  const { id } = await params;
  const song = await getSongById(id);
  if (!song) notFound();

  const t = await getTranslations("song");
  const currentVersion = song.versions[0];
  const lines = currentVersion?.lyrics.split("\n") ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-3">
          <span className="text-[32px] leading-none text-[var(--color-stone)] font-[var(--font-display)]">
            {String(song.index).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">
              {song.title}
            </h1>
            <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)]">
              {song.authors.map((a) => a.name).join(", ")}
            </p>
          </div>
          <StatusBadge status={song.status.toLowerCase() as "finished" | "draft"} />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {song.languages.map((l) => (
            <Tag key={l.code} label={l.name} />
          ))}
          {song.tags.map((t) => (
            <Tag key={t.name} label={t.name} variant={t.category === "MOOD" ? "mood" : "keyword"} />
          ))}
        </div>
        <SongDetailClient songId={song.id} />
      </div>

      {song.versions.length > 1 && (
        <div className="mb-6">
          <SectionLabel>{t("versions")}</SectionLabel>
          <div className="flex gap-2">
            {song.versions.map((v) => (
              <span
                key={v.id}
                className="px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] bg-[var(--color-sand)] text-[var(--color-text-body)]"
              >
                v{v.versionNumber} — {v.versionType.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <SectionLabel>{t("lyrics")}</SectionLabel>
        <div className="space-y-0.5">
          {lines.map((line, i) => {
            const annotation = currentVersion?.annotations.find((a) => a.lineNumber === i + 1);
            return (
              <div key={i}>
                <div className="flex gap-3 py-1 group">
                  <span className="text-[12px] text-[var(--color-stone)] font-[var(--font-ui)] min-w-[24px] text-right select-none pt-0.5">
                    {i + 1}
                  </span>
                  <span
                    className={`text-[16px] text-[var(--color-deep)] font-[var(--font-display)] ${line.trim() === "" ? "h-4" : ""} ${annotation ? "bg-[var(--color-amber-light)] px-1 -mx-1 rounded" : ""}`}
                  >
                    {line || "\u00A0"}
                  </span>
                </div>
                {annotation && (
                  <div className="ml-9 my-2">
                    <AnnotationBlock lineText={annotation.lineText} note={annotation.note} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {song.notes.length > 0 && (
        <div className="mb-8">
          <SectionLabel>{t("notes")}</SectionLabel>
          <div className="space-y-3">
            {song.notes.map((note) => (
              <div key={note.id} className="bg-[var(--color-linen)] rounded-[var(--radius-md)] px-4 py-3">
                <p className="text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)] italic">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
