"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, MonitorPlay, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getLyricsContent, stanzaNumbers } from "@/lib/lyrics";

type Item = {
  key: string;
  label: string;
  note: string;
  stanzas: number[];
  song: { id: string; index: number; title: string; stanzaNumbers: number[] } | null;
};

type Initial = {
  id: string;
  code: string;
  title: string;
  date: string | null;
  notes: string | null;
  shared: boolean;
  items: Item[];
};

const MOMENTS = ["entrance", "praise", "confession", "beforeSermon", "offering", "communion", "closing"] as const;

export function ProgrammeEditor({ initial, shareBase }: { initial: Initial; shareBase: string }) {
  const t = useTranslations("programmes");
  const tc = useTranslations("common");
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [shared, setShared] = useState(initial.shared);
  const [items, setItems] = useState<Item[]>(initial.items);
  const [number, setNumber] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${shareBase}${initial.code}`;
  const touch = () => setDirty(true);

  const update = (key: string, patch: Partial<Item>) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));
    touch();
  };

  const move = (i: number, delta: number) => {
    setItems((list) => {
      const next = [...list];
      const j = i + delta;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    touch();
  };

  const addHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");
    const n = Number(number);
    if (!n) return;
    const res = await fetch(`/api/songs/${n}`);
    if (!res.ok) {
      setLookupError(t("hymnNotFound", { n }));
      return;
    }
    const song = (await res.json()) as { id: string; index: number; title: string; versions: Array<{ content: unknown; lyrics: string }> };
    const content = song.versions[0] ? getLyricsContent(song.versions[0]) : null;
    setItems((list) => [
      ...list,
      {
        key: crypto.randomUUID(),
        label: "",
        note: "",
        stanzas: [],
        song: { id: song.id, index: song.index, title: song.title, stanzaNumbers: content ? stanzaNumbers(content) : [] },
      },
    ]);
    setNumber("");
    touch();
  };

  const addMoment = () => {
    setItems((list) => [...list, { key: crypto.randomUUID(), label: "", note: "", stanzas: [], song: null }]);
    touch();
  };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/setlists/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || t("defaultTitle"),
          date: date || null,
          notes: notes.trim() || null,
          shared,
          items: items.map((it) => ({
            songId: it.song?.id ?? null,
            label: it.label.trim() || null,
            stanzas: it.stanzas,
            note: it.note.trim() || null,
          })),
        }),
      });
      if (res.ok) {
        setDirty(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [date, initial.id, items, notes, router, shared, t, title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, save]);

  const remove = async () => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/dashboard/setlists/${initial.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/programmes");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("shareLink"), shareUrl);
    }
  };

  const chip = (active: boolean) =>
    `min-w-[34px] h-[30px] px-2 rounded-[var(--radius-pill)] text-[12px] border-[0.5px] cursor-pointer ${
      active ? "bg-forest text-parchment border-forest" : "bg-linen text-text-body border-stone hover:bg-sand"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <datalist id="moments">
        {MOMENTS.map((m) => (
          <option key={m} value={t(`moment.${m}`)} />
        ))}
      </datalist>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input id="title" label={t("titleLabel")} value={title} onChange={(e) => { setTitle(e.target.value); touch(); }} />
        <Input id="date" label={t("dateLabel")} type="date" value={date} onChange={(e) => { setDate(e.target.value); touch(); }} />
      </div>

      <section>
        <h2 className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted mb-2">{t("order")}</h2>
        {items.length === 0 && <p className="text-[13px] text-text-muted bg-linen rounded-[var(--radius-md)] p-4 m-0">{t("noItems")}</p>}
        <ol className="list-none p-0 m-0 flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={it.key} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] p-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("moveUp")} className="p-1 bg-transparent border-none cursor-pointer text-text-muted disabled:opacity-30">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={t("moveDown")} className="p-1 bg-transparent border-none cursor-pointer text-text-muted disabled:opacity-30">
                    <ArrowDown size={15} />
                  </button>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {it.song ? (
                      <Link href={`/songs/${it.song.index}`} className="no-underline min-w-0">
                        <span className="font-display text-[20px] text-deep mr-2">{it.song.index}</span>
                        <span className="font-display text-[15px] text-text-body">{it.song.title}</span>
                      </Link>
                    ) : (
                      <span className="text-[12px] text-text-muted">{t("momentOnly")}</span>
                    )}
                  </div>
                  <input
                    list="moments"
                    value={it.label}
                    onChange={(e) => update(it.key, { label: e.target.value })}
                    placeholder={t("labelPlaceholder")}
                    className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep outline-none focus:border-forest"
                  />
                  {it.song && it.song.stanzaNumbers.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-text-muted mr-1">{t("stanzas")}</span>
                      <button type="button" className={chip(it.stanzas.length === 0)} onClick={() => update(it.key, { stanzas: [] })}>
                        {t("allStanzas")}
                      </button>
                      {it.song.stanzaNumbers.map((n) => {
                        const on = it.stanzas.includes(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            className={chip(on)}
                            aria-pressed={on}
                            onClick={() =>
                              update(it.key, {
                                stanzas: on ? it.stanzas.filter((x) => x !== n) : [...it.stanzas, n].sort((a, b) => a - b),
                              })
                            }
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <input
                    value={it.note}
                    onChange={(e) => update(it.key, { note: e.target.value })}
                    placeholder={t("notePlaceholder")}
                    className="bg-transparent border-none border-b-[0.5px] border-b-stone px-0 py-1 text-[12px] text-text-body outline-none"
                  />
                </div>
                <button type="button" onClick={() => { setItems((l) => l.filter((x) => x.key !== it.key)); touch(); }} aria-label={tc("remove")} className="p-1 bg-transparent border-none cursor-pointer text-text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <form onSubmit={addHymn} className="flex items-end gap-2">
            <Input id="add-number" label={t("addByNumber")} inputMode="numeric" pattern="[0-9]*" value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} className="w-28" />
            <Button type="submit" variant="secondary" disabled={!number}>
              <Plus size={14} /> {t("addHymnButton")}
            </Button>
          </form>
          <Button type="button" variant="ghost" onClick={addMoment}>
            <Plus size={14} /> {t("addMoment")}
          </Button>
        </div>
        {lookupError && <p className="text-[12px] text-danger mt-2 mb-0">{lookupError}</p>}
      </section>

      <div>
        <label htmlFor="notes" className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">{t("notesLabel")}</label>
        <textarea id="notes" rows={3} value={notes} onChange={(e) => { setNotes(e.target.value); touch(); }} className="mt-1 w-full bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep outline-none focus:border-forest" />
      </div>

      <div className="sticky bottom-0 z-10 -mx-3 px-3 py-3 bg-parchment border-t-[0.5px] border-t-stone flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={saving || !dirty}>
          {saving && <Spinner />} {dirty ? t("save") : t("saved")}
        </Button>
        <Button type="button" variant="ghost" onClick={remove} className="ml-auto text-danger">
          <Trash2 size={14} /> {tc("delete")}
        </Button>
      </div>

      <section className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4">
        <h2 className="font-display text-[18px] text-deep m-0 mb-1">{t("shareTitle")}</h2>
        <label className="flex items-center gap-2 text-[13px] text-text-body mb-3 cursor-pointer">
          <input type="checkbox" checked={shared} onChange={(e) => { setShared(e.target.checked); touch(); }} />
          {t("sharedLabel")}
        </label>
        {shared ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="bg-white p-2 rounded-[var(--radius-md)] shrink-0">
              <QRCodeSVG value={shareUrl} size={132} marginSize={1} fgColor="#1e3a1e" />
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <code className="text-[12px] break-all text-text-body">{shareUrl}</code>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={copy}>
                  <Copy size={13} /> {copied ? t("copied") : t("copyLink")}
                </Button>
                <a href={`/p/${initial.code}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-forest no-underline">
                  <ExternalLink size={13} /> {t("open")}
                </a>
                <a href={`/p/${initial.code}/present`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-forest no-underline">
                  <MonitorPlay size={13} /> {t("present")}
                </a>
                <a href={`/p/${initial.code}?print=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-forest no-underline">
                  <Printer size={13} /> {t("print")}
                </a>
              </div>
              {dirty && <p className="text-[12px] text-amber m-0">{t("saveFirst")}</p>}
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-text-muted m-0">{t("privateHint")}</p>
        )}
      </section>
    </div>
  );
}
