"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Grid3x3 } from "lucide-react";
import { openGoTo } from "@/components/songs/goto-hymn";
import { readRecentHymns } from "@/components/songs/hymn-actions";

/** The church use case first: type a number, open the hymn. */
export function HomeGoTo() {
  const t = useTranslations("home");
  const router = useRouter();
  const [n, setN] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (n) router.push(`/songs/${Number(n)}`);
      }}
      className="w-full max-w-md mx-auto"
    >
      <label htmlFor="home-n" className="block text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted mb-2 text-center">
        {t("gotoLabel")}
      </label>
      <div className="flex items-stretch gap-2">
        <div className="flex-1 flex items-center bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] focus-within:border-forest px-4">
          <span className="font-display text-[22px] text-stone mr-2" aria-hidden>
            N°
          </span>
          <input
            id="home-n"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={n}
            onChange={(e) => setN(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            className="w-full min-w-0 bg-transparent border-none outline-none font-display text-[30px] text-deep py-2 placeholder:text-sand"
          />
        </div>
        <button
          type="submit"
          disabled={!n}
          aria-label={t("gotoCta")}
          className="px-5 rounded-[var(--radius-lg)] bg-forest text-parchment border-none cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 text-[14px]"
        >
          <span className="hidden sm:inline">{t("gotoCta")}</span>
          <ArrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => openGoTo(n)}
          aria-label={t("keypad")}
          title={t("keypad")}
          className="w-12 rounded-[var(--radius-lg)] bg-linen border-[0.5px] border-stone text-deep cursor-pointer inline-flex items-center justify-center hover:bg-sand"
        >
          <Grid3x3 size={18} />
        </button>
      </div>
      <p className="text-[12px] text-text-muted text-center mt-2 mb-0 hidden md:block">{t("gotoTip")}</p>
    </form>
  );
}

export function RecentHymns() {
  const t = useTranslations("home");
  const [recent, setRecent] = useState<Array<{ index: number; title: string }>>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setRecent(readRecentHymns());
  }, []);
  if (!recent.length) return null;
  return (
    <section className="w-full">
      <h2 className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted mb-2">{t("recent")}</h2>
      <div className="flex flex-wrap gap-2">
        {recent.map((r) => (
          <Link
            key={r.index}
            href={`/songs/${r.index}`}
            className="inline-flex items-baseline gap-2 max-w-full px-3 py-2 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone no-underline hover:border-forest"
          >
            <span className="font-display text-[17px] text-deep">{r.index}</span>
            <span className="font-display text-[13px] text-text-body truncate max-w-[14rem]">{r.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
