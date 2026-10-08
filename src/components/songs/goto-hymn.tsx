"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CornerDownLeft, Delete, Hash, X } from "lucide-react";

type Entry = { index: number; title: string; firstLine: string };

let indexCache: Entry[] | null = null;
const INDEX_KEY = "mmb:index";

export async function loadIndex(): Promise<Entry[]> {
  if (indexCache) return indexCache;
  try {
    const res = await fetch("/api/songs/index");
    if (res.ok) {
      indexCache = ((await res.json()) as { songs: Entry[] }).songs;
      try {
        localStorage.setItem(INDEX_KEY, JSON.stringify(indexCache));
      } catch {
        /* quota */
      }
      return indexCache;
    }
  } catch {
    /* offline */
  }
  try {
    indexCache = JSON.parse(localStorage.getItem(INDEX_KEY) ?? "[]") as Entry[];
  } catch {
    indexCache = [];
  }
  return indexCache;
}

/** Opens the number pad from anywhere: `openGoTo()` or `openGoTo("4")`. */
export function openGoTo(initial = "") {
  window.dispatchEvent(new CustomEvent("mmb:goto", { detail: initial }));
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/** "Go to hymn N": header button + number pad; typing digits anywhere opens it. */
export function GoToHymn({ variant = "header" }: { variant?: "header" | "none" }) {
  const t = useTranslations("goto");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  const show = useCallback((initial: string) => {
    setValue(initial.replace(/\D/g, "").slice(0, 4));
    setOpen(true);
    void loadIndex().then(setEntries);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => show(((e as CustomEvent).detail as string) ?? "");
    const onKey = (e: KeyboardEvent) => {
      if (open || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (/^[0-9]$/.test(e.key) && !document.querySelector("[data-present]")) {
        e.preventDefault();
        show(e.key);
      }
    };
    window.addEventListener("mmb:goto", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mmb:goto", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, show]);

  const n = Number(value);
  const match = value ? entries.find((e) => e.index === n) : undefined;

  const go = useCallback(() => {
    if (!value) return;
    setOpen(false);
    router.push(`/songs/${Number(value)}`);
  }, [router, value]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "Enter") go();
      else if (e.key === "Backspace") setValue((v) => v.slice(0, -1));
      else if (/^[0-9]$/.test(e.key)) setValue((v) => (v + e.key).slice(0, 4));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const key = "h-16 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[24px] font-display text-deep cursor-pointer hover:bg-sand active:bg-sand transition-colors flex items-center justify-center";

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={() => show("")}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[var(--radius-pill)] border-[0.5px] border-stone bg-parchment text-deep text-[13px] font-ui cursor-pointer hover:bg-sand transition-colors"
          aria-label={t("open")}
          title={t("hint")}
        >
          <Hash size={15} aria-hidden />
          <span>{t("short")}</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#0f150f]/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-xs bg-parchment border-[0.5px] border-stone rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">{t("title")}</span>
              <button type="button" onClick={() => setOpen(false)} className="p-2 -m-2 bg-transparent border-none cursor-pointer text-text-muted" aria-label={t("close")}>
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-3" aria-live="polite">
              <div className="font-display text-[48px] leading-none text-deep min-h-[48px] tabular-nums">{value || <span className="text-stone">—</span>}</div>
              <div className="mt-2 min-h-[40px] text-[13px] font-display text-green-muted line-clamp-2 px-2">
                {value ? (match ? match.firstLine || match.title : entries.length ? t("notFound") : "") : t("hint")}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button key={d} type="button" className={key} onClick={() => setValue((v) => (v + d).slice(0, 4))}>
                  {d}
                </button>
              ))}
              <button type="button" className={key} onClick={() => setValue((v) => v.slice(0, -1))} aria-label={t("erase")}>
                <Delete size={22} />
              </button>
              <button type="button" className={key} onClick={() => setValue((v) => (v + "0").slice(0, 4))}>
                0
              </button>
              <button
                type="button"
                onClick={go}
                disabled={!value}
                aria-label={t("go")}
                className="h-16 rounded-[var(--radius-md)] bg-forest text-parchment border-none cursor-pointer disabled:opacity-40 flex items-center justify-center"
              >
                <CornerDownLeft size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
