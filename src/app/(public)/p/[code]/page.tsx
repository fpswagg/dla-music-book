import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { MonitorPlay } from "lucide-react";
import { getSetlist } from "@/lib/setlists";
import { getCurrentUser } from "@/lib/auth-helpers";
import { LyricsView } from "@/components/songs/lyrics-view";
import { HymnHeader } from "@/components/songs/hymn-header";
import { AutoPrint, PrintButton } from "@/components/ui/print";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ print?: string }> };

async function load(code: string) {
  const [setlist, user] = await Promise.all([getSetlist({ code }), getCurrentUser()]);
  if (!setlist || (!setlist.shared && setlist.ownerId !== user?.id)) return null;
  return { setlist, isOwner: setlist.ownerId === user?.id };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const data = await load(code);
  if (!data) return { title: "404", robots: { index: false } };
  return { title: data.setlist.title, robots: { index: false } };
}

export default async function ProgrammePublicPage({ params, searchParams }: Props) {
  const [{ code }, { print }] = await Promise.all([params, searchParams]);
  const data = await load(code);
  if (!data) notFound();
  const { setlist, isOwner } = data;
  const [t, format] = await Promise.all([getTranslations("programmes"), getFormatter()]);

  return (
    <article className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {print && <AutoPrint />}
      <header className="text-center mb-8">
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0 mb-2">{t("kicker")}</p>
        <h1 className="font-display text-[28px] text-deep m-0 text-balance">{setlist.title}</h1>
        {setlist.date && (
          <p className="text-[14px] text-green-muted mt-2 mb-0">
            {format.dateTime(new Date(`${setlist.date}T12:00:00Z`), { dateStyle: "full" })}
          </p>
        )}
        <div className="no-print mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/p/${setlist.code}/present`} className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-[var(--radius-md)] bg-forest text-parchment text-[13px] no-underline">
            <MonitorPlay size={15} /> {t("present")}
          </Link>
          <PrintButton label={t("print")} />
          {isOwner && (
            <Link href={`/dashboard/programmes/${setlist.id}`} className="inline-flex items-center min-h-[40px] px-3 text-[13px] text-forest">
              {t("edit")}
            </Link>
          )}
        </div>
      </header>

      <ol className="list-none p-0 m-0 mb-10 border-[0.5px] border-stone rounded-[var(--radius-lg)] divide-y-[0.5px] divide-stone">
        {setlist.items.map((it, i) => (
          <li key={it.id} className="flex items-baseline gap-3 px-4 py-2.5">
            <span className="text-[12px] text-text-muted w-5 shrink-0 tabular-nums">{i + 1}.</span>
            <span className="text-[13px] text-text-muted min-w-[7rem]">{it.label}</span>
            {it.song ? (
              <a href={`#h${i}`} className="no-underline min-w-0 truncate">
                <span className="font-display text-[16px] text-deep">{it.song.index}</span>{" "}
                <span className="font-display text-[14px] text-text-body">{it.song.title}</span>
                {it.stanzas.length > 0 && <span className="text-[12px] text-text-muted"> · {t("stanzasList", { list: it.stanzas.join(", ") })}</span>}
              </a>
            ) : (
              <span className="text-[14px] text-text-body">{it.note}</span>
            )}
          </li>
        ))}
      </ol>

      {setlist.notes && <p className="text-[14px] text-text-body whitespace-pre-line bg-linen rounded-[var(--radius-md)] p-4 mb-10">{setlist.notes}</p>}

      <div className="flex flex-col gap-12 print-columns">
        {setlist.items.map((it, i) =>
          it.song ? (
            <section key={it.id} id={`h${i}`} className="print-hymn scroll-mt-20">
              {it.label && <p className="text-center text-[11px] font-medium tracking-[0.08em] uppercase text-amber m-0 mb-2">{it.label}</p>}
              <HymnHeader index={it.song.index} title={it.song.title} references={it.song.references} size="sm" />
              {it.note && <p className="text-center text-[12px] text-text-muted mt-1 mb-0">{it.note}</p>}
              <div className="mt-5 max-w-xl mx-auto">
                <LyricsView content={it.song.content} stanzas={it.stanzas} />
              </div>
            </section>
          ) : null,
        )}
      </div>
    </article>
  );
}
