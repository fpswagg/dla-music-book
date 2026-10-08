"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Search } from "lucide-react";
import { loadIndex } from "@/components/songs/goto-hymn";
import { readRecentHymns } from "@/components/songs/hymn-actions";

type Entry = Awaited<ReturnType<typeof loadIndex>>[number];

/** The church use case first: a big number field (the phone shows its number pad), the hymn's first line as you type. */
export function HomeGoTo() {
  const t = useTranslations("home");
  const router = useRouter();
  const [n, setN] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  // Small (number → first line) list, also kept in localStorage for offline use.
  useEffect(() => void loadIndex().then(setEntries), []);
  const match = n ? entries.find((e) => e.index === Number(n)) : undefined;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (n) router.push(`/songs/${Number(n)}`);
      }}
    >
      <label htmlFor="home-n" className="sr-only">
        {t("gotoLabel")}
      </label>
      <div className="relative flex items-center justify-center border-b border-stone focus-within:border-forest transition-colors">
        <input
          id="home-n"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="go"
          value={n}
          onChange={(e) => setN(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder={t("gotoPlaceholder")}
          className="w-full bg-transparent border-none outline-none text-center font-display text-[56px] leading-none text-deep py-2 tabular-nums placeholder:text-[28px] placeholder:text-stone"
        />
        {n && (
          <button
            type="submit"
            aria-label={t("gotoCta")}
            className="absolute right-0 w-11 h-11 rounded-full bg-forest text-parchment border-none cursor-pointer inline-flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </button>
        )}
      </div>
      <p className="mt-3 mb-0 min-h-[1.5em] font-display text-[15px] text-green-muted truncate" aria-live="polite">
        {n && entries.length ? (match ? match.firstLine || match.title : t("gotoMissing")) : " "}
      </p>
    </form>
  );
}

/** Quiet search line: titles, lyrics (accents optional) or numbers. */
export function HomeSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        router.push(v ? `/songs?q=${encodeURIComponent(v)}` : "/songs");
      }}
      className="flex items-center gap-3 px-4 h-12 rounded-[var(--radius-pill)] bg-linen focus-within:bg-sand transition-colors"
    >
      <Search size={17} className="text-green-muted shrink-0" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        autoComplete="off"
        enterKeyHint="search"
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] text-deep placeholder:text-text-muted"
      />
    </form>
  );
}

/** The last hymns opened on this device (nothing shown on a first visit). */
export function RecentHymns() {
  const t = useTranslations("home");
  const [recent, setRecent] = useState<Array<{ index: number; title: string }>>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setRecent(readRecentHymns().slice(0, 4));
  }, []);
  if (!recent.length) return null;
  return (
    <section className="text-left">
      <h2 className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0 mb-1 text-center">{t("recent")}</h2>
      <ul className="list-none p-0 m-0">
        {recent.map((r) => (
          <li key={r.index}>
            <Link href={`/songs/${r.index}`} className="flex items-baseline gap-3 py-2 no-underline group">
              <span className="font-display text-[17px] text-stone w-10 text-right shrink-0 tabular-nums group-hover:text-forest">{r.index}</span>
              <span className="font-display text-[16px] text-deep truncate">{r.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
