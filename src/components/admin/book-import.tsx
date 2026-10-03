"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DualaKeyboard } from "@/components/ui/duala-keyboard";
import { LyricsView } from "@/components/songs/lyrics-view";
import { parseBookText, type ImportedHymn } from "@/lib/book-import";
import { serializeLyrics } from "@/lib/lyrics";
import type { HymnalView } from "@/lib/data-provider";

const EXAMPLE = `5
M.B.8. - Evang. S. 189.
1. Edube na Loba!
Mo̱ń na wase, kasa!
Sesa Sango!

2. Dinge̱le̱ bejedi,
basangi ba lati
sesa Sango.

6
M. B. 11. - S. S. et S. 621.
1. Loba le bwam! mo̱ń na wase,
minja, midongo na mindi,

10`;

/** Paste digitised pages of the book → check the parsed hymns → save. */
export function BookImport({ hymnals, existingIndexes }: { hymnals: HymnalView[]; existingIndexes: number[] }) {
  const t = useTranslations("import");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ImportedHymn[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const [onExisting, setOnExisting] = useState<"skip" | "overwrite">("skip");
  const [status, setStatus] = useState<"DRAFT" | "FINISHED">("DRAFT");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const existing = useMemo(() => new Set(existingIndexes), [existingIndexes]);
  const selected = (parsed ?? []).filter((h) => !excluded.has(h.index));

  const analyse = () => {
    setResult(null);
    setError("");
    setExcluded(new Set());
    setParsed(parseBookText(text, hymnals));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const total = { created: 0, updated: 0, skipped: 0 };
    try {
      for (let i = 0; i < selected.length; i += 100) {
        const chunk = selected.slice(i, i + 100);
        const res = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onExisting,
            status,
            hymns: chunk.map((h) => ({
              index: h.index,
              title: h.title,
              page: h.page,
              lyricsText: serializeLyrics(h.content),
              references: h.references.filter((r) => r.hymnalId).map((r) => ({ hymnalId: r.hymnalId!, number: r.number })),
            })),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as typeof total & { error?: string };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        total.created += data.created;
        total.updated += data.updated;
        total.skipped += data.skipped;
      }
      setResult(total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("title")}</h1>
        <p className="text-[13px] text-green-muted m-0 max-w-2xl leading-relaxed">{t("intro")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DualaKeyboard target={ref} onChange={setText} />
          <button type="button" onClick={() => setText(EXAMPLE)} className="bg-transparent border-none text-[12px] text-forest cursor-pointer">
            {t("example")}
          </button>
        </div>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={t("placeholder")}
          className="w-full bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3.5 py-2.5 text-[14px] leading-relaxed text-deep font-display outline-none resize-y focus:border-forest focus:bg-parchment"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Button type="button" onClick={analyse} disabled={!text.trim()}>
            {t("analyse")}
          </Button>
          <span className="text-[12px] text-text-muted">{t("rules")}</span>
        </div>
      </div>

      {parsed && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0">{t("found", { count: parsed.length })}</h2>
          {parsed.length === 0 && <p className="text-[13px] text-danger m-0">{t("nothing")}</p>}
          <ul className="list-none p-0 m-0 border-[0.5px] border-stone rounded-[var(--radius-lg)] divide-y-[0.5px] divide-stone overflow-hidden">
            {parsed.map((h) => {
              const isOn = !excluded.has(h.index);
              const stanzas = h.content.blocks.filter((b) => b.kind === "stanza").length;
              const hasRefrain = h.content.blocks.some((b) => b.kind === "refrain");
              return (
                <li key={`${h.index}-${h.title}`} className={`bg-parchment ${isOn ? "" : "opacity-50"}`}>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isOn}
                      aria-label={t("include", { n: h.index })}
                      onChange={() =>
                        setExcluded((prev) => {
                          const next = new Set(prev);
                          if (next.has(h.index)) next.delete(h.index);
                          else next.add(h.index);
                          return next;
                        })
                      }
                      className="mt-1.5"
                    />
                    <button type="button" onClick={() => setOpen(open === h.index ? null : h.index)} className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0">
                      <span className="font-display text-[20px] text-deep mr-2">{h.index}</span>
                      <span className="font-display text-[15px] text-text-body">{h.title}</span>
                      <span className="block text-[12px] text-text-muted mt-0.5">
                        {t("summary", { stanzas, refrain: hasRefrain ? 1 : 0 })}
                        {h.page && ` · ${t("page", { page: h.page })}`}
                        {h.references.length > 0 && ` · ${h.references.map((r) => `${r.code} ${r.number}`).join(" – ")}`}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {existing.has(h.index) && <Badge tone="amber">{t("exists")}</Badge>}
                      {h.warnings.map((w) => (
                        <Badge key={w} tone="danger">
                          {t(`warning.${w}` as "warning.empty")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {open === h.index && (
                    <div className="px-4 pb-4 pl-11 max-w-xl">
                      <LyricsView content={h.content} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {parsed.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4">
              <label className="flex items-center gap-2 text-[13px]">
                {t("onExisting")}
                <select value={onExisting} onChange={(e) => setOnExisting(e.target.value as typeof onExisting)} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-sm)] px-2 py-1 text-[13px]">
                  <option value="skip">{t("skip")}</option>
                  <option value="overwrite">{t("overwrite")}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-[13px]">
                {t("status")}
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-sm)] px-2 py-1 text-[13px]">
                  <option value="DRAFT">{t("draft")}</option>
                  <option value="FINISHED">{t("published")}</option>
                </select>
              </label>
              <Button type="button" onClick={save} disabled={saving || selected.length === 0} className="ml-auto">
                {saving && <Spinner />} {t("save", { count: selected.length })}
              </Button>
            </div>
          )}
          {error && <p role="alert" className="text-[13px] text-danger m-0">{error}</p>}
          {result && (
            <p className="text-[13px] text-forest bg-green-light rounded-[var(--radius-md)] px-3 py-2 m-0">
              {t("result", result)} <Link href="/admin/songs" className="text-forest">{t("seeSongs")}</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "amber" | "danger"; children: React.ReactNode }) {
  return (
    <span className={`px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] whitespace-nowrap ${tone === "amber" ? "bg-amber-light text-amber" : "bg-danger-light text-danger"}`}>
      {children}
    </span>
  );
}
