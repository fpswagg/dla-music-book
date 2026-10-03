import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPublishedSongs } from "@/lib/data-provider";
import { HymnHeader } from "@/components/songs/hymn-header";
import { LyricsView } from "@/components/songs/lyrics-view";
import { PrintButton } from "@/components/ui/print";

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

const MAX = 80;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("printBook");
  return { title: t("title"), robots: { index: false } };
}

/** Print a range of hymns in the layout of the original book (number, references, two columns). */
export default async function PrintPage({ searchParams }: Props) {
  const sp = await searchParams;
  const t = await getTranslations("printBook");
  const from = Math.max(1, Number(sp.from) || 1);
  const to = Math.max(from, Math.min(from + MAX - 1, Number(sp.to) || from + 19));
  const songs = await getPublishedSongs({ from, to });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <form className="no-print flex flex-wrap items-end gap-3 mb-6 bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4">
        <h1 className="w-full font-display text-[22px] text-deep m-0">{t("title")}</h1>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.08em] text-text-muted">
          {t("from")}
          <input name="from" type="number" min={1} defaultValue={from} className="w-24 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[14px] text-deep" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.08em] text-text-muted">
          {t("to")}
          <input name="to" type="number" min={1} defaultValue={to} className="w-24 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[14px] text-deep" />
        </label>
        <button type="submit" className="min-h-[40px] px-4 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[13px] text-deep cursor-pointer">
          {t("apply")}
        </button>
        <PrintButton label={t("print")} />
        <p className="w-full text-[12px] text-text-muted m-0">{t("hint", { max: MAX })}</p>
      </form>

      <div className="print-columns md:columns-2 md:gap-10">
        {songs.map((s) => (
          <section key={s.id} className="print-hymn break-inside-avoid mb-10">
            <HymnHeader index={s.index} references={s.references} size="sm" />
            <div className="mt-3">{s.versions[0] && <LyricsView content={s.versions[0].content} />}</div>
          </section>
        ))}
      </div>
      {songs.length === 0 && <p className="text-[14px] text-text-muted">{t("empty")}</p>}
    </div>
  );
}
