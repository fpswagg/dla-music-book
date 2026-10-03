"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MonitorPlay, Printer, Share2 } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { trackSongView } from "@/lib/analytics/tracker";
import { AddToProgramme } from "@/components/setlists/add-to-programme";

const RECENT_KEY = "mmb:recent";

/** Remember the last hymns opened (home page "recently opened"). */
export function rememberHymn(index: number, title: string) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Array<{ index: number; title: string }>;
    const next = [{ index, title }, ...list.filter((x) => x.index !== index)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readRecentHymns(): Array<{ index: number; title: string }> {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const btn =
  "inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[var(--radius-md)] text-[13px] font-ui text-text-body bg-transparent border-[0.5px] border-stone cursor-pointer hover:bg-sand transition-colors no-underline";

export function HymnActions({
  songId,
  index,
  title,
  signedIn,
  children,
}: {
  songId: string;
  index: number;
  title: string;
  signedIn: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("song");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    rememberHymn(index, title);
    trackSongView(songId, title);
  }, [index, songId, title]);

  const share = async () => {
    const url = `${window.location.origin}/songs/${index}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${index}. ${title}`, url });
        return;
      } catch {
        /* cancelled: fall back to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t("copyThisLink"), url);
    }
  };

  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-2">
      <Link href={`/songs/${index}/present`} className={`${btn} bg-forest text-parchment border-forest hover:bg-deep`}>
        <MonitorPlay size={15} /> {t("present")}
      </Link>
      <button type="button" className={btn} onClick={share}>
        <Share2 size={15} /> {t("share")}
      </button>
      <button type="button" className={btn} onClick={() => window.print()}>
        <Printer size={15} /> {t("print")}
      </button>
      {signedIn && <AddToProgramme songId={songId} index={index} />}
      {children}
      <Toast message={t("linkCopied")} visible={copied} onClose={() => setCopied(false)} />
    </div>
  );
}

/** Previous / next hymn, also with ← → keys. */
export function HymnPager({ prev, next }: { prev: number | null; next: number | null }) {
  const t = useTranslations("song");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/songs/${prev}`);
      if (e.key === "ArrowRight" && next) router.push(`/songs/${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  const cls = "inline-flex items-center gap-1 min-h-[44px] px-4 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[14px] text-deep no-underline hover:bg-sand";
  return (
    <nav className="no-print flex items-center justify-between gap-3" aria-label={t("pager")}>
      {prev ? (
        <Link href={`/songs/${prev}`} className={cls} rel="prev">
          <ChevronLeft size={16} /> <span className="font-display">{prev}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/songs/${next}`} className={cls} rel="next">
          <span className="font-display">{next}</span> <ChevronRight size={16} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
