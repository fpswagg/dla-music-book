"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { LyricsView } from "@/components/songs/lyrics-view";
import { HymnHeader } from "@/components/songs/hymn-header";
import { normalizeForSearch } from "@/lib/duala";
import { plainLyrics } from "@/lib/lyrics";
import { offlineSupported, readOfflineBundle, saveOfflineBundle, type OfflineBundle } from "./offline-store";

export function OfflineReader() {
  const t = useTranslations("offline");
  const [bundle, setBundle] = useState<OfflineBundle | null | undefined>(undefined);
  const [current, setCurrent] = useState<number | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("n"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL once on mount
    if (n > 0) setCurrent(n);
    if (!offlineSupported()) {
      setBundle(null);
      return;
    }
    // Nothing cached yet but the network is back: fetch it quietly instead of asking.
    void readOfflineBundle().then((b) => (b ? setBundle(b) : saveOfflineBundle().then(setBundle, () => setBundle(null))));
  }, []);

  const songs = useMemo(() => bundle?.songs ?? [], [bundle]);
  const results = useMemo(() => {
    const needle = normalizeForSearch(q);
    if (!needle) return songs;
    if (/^\d+$/.test(needle)) return songs.filter((s) => String(s.index).startsWith(needle));
    return songs.filter((s) => normalizeForSearch(`${s.title} ${plainLyrics(s.content)}`).includes(needle));
  }, [q, songs]);

  const idx = songs.findIndex((s) => s.index === current);
  const song = idx >= 0 ? songs[idx] : null;

  const open = (n: number | null) => {
    setCurrent(n);
    const url = n ? `/offline?n=${n}` : "/offline";
    window.history.replaceState(null, "", url);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-30 bg-linen border-b-[0.5px] border-b-stone pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-3 h-14 flex items-center gap-3">
          <button type="button" onClick={() => open(null)} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 mr-auto">
            <BookOpen size={20} className="text-forest" />
            <span className="font-display text-[18px] text-deep">Myenge ma Bonakristo</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {bundle === undefined ? null : !bundle ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-text-body mb-4">{t("empty")}</p>
            <p className="mt-6">
              <Link href="/" className="text-forest text-[13px]">{t("backOnline")}</Link>
            </p>
          </div>
        ) : song ? (
          <article>
            <HymnHeader index={song.index} title={song.title} references={song.references} meta={song.authors.join(", ")} />
            <div className="mt-8 max-w-xl mx-auto">
              <LyricsView content={song.content} />
            </div>
            <nav className="mt-10 flex justify-between gap-3">
              <button type="button" disabled={idx <= 0} onClick={() => open(songs[idx - 1]?.index ?? null)} className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[13px] text-deep cursor-pointer disabled:opacity-40">
                <ChevronLeft size={16} /> {idx > 0 ? songs[idx - 1].index : ""}
              </button>
              <button type="button" onClick={() => open(null)} className="px-3 py-2 bg-transparent border-none text-[13px] text-forest cursor-pointer">
                {t("allHymns")}
              </button>
              <button type="button" disabled={idx >= songs.length - 1} onClick={() => open(songs[idx + 1]?.index ?? null)} className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[13px] text-deep cursor-pointer disabled:opacity-40">
                {idx < songs.length - 1 ? songs[idx + 1].index : ""} <ChevronRight size={16} />
              </button>
            </nav>
          </article>
        ) : (
          <>
            {current && <p className="text-[13px] text-danger mb-4">{t("notSaved", { n: current })}</p>}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              inputMode="search"
              className="w-full bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-4 py-3 text-[16px] text-deep outline-none focus:border-forest mb-4"
            />
            <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted mb-2">
              {t("count", { count: results.length })}
            </p>
            <ul className="list-none p-0 m-0 divide-y-[0.5px] divide-stone border-[0.5px] border-stone rounded-[var(--radius-lg)] overflow-hidden">
              {results.slice(0, 300).map((s) => (
                <li key={s.index}>
                  <button type="button" onClick={() => open(s.index)} className="w-full flex gap-3 items-baseline text-left px-4 py-3 bg-parchment hover:bg-sand border-none cursor-pointer">
                    <span className="font-display text-[18px] text-stone w-10 shrink-0 tabular-nums">{s.index}</span>
                    <span className="font-display text-[16px] text-deep truncate">{s.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
