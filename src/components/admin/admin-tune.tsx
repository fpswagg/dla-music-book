"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { ScoreList, type ScoreItem } from "@/components/music/score-list";
import { ScoreUpload } from "@/components/music/score-upload";

type Tune = {
  id: string;
  name: string;
  key: string | null;
  timeSignature: string | null;
  metre: string | null;
  composer: string | null;
  source: string | null;
  license: string | null;
  notes: string | null;
  songs: Array<{ id: string; index: number; title: string; tune: string | null }>;
  scores: ScoreItem[];
};
const FIELDS = ["name", "key", "timeSignature", "metre", "composer", "source", "license"] as const;

/** One tune: its details, the hymns sung to it and its scores (with moderation). */
export function AdminTune({ tune, links }: { tune: Tune; links: Array<{ label: string; url: string }> }) {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const router = useRouter();
  const [draft, setDraft] = useState(() => Object.fromEntries([...FIELDS, "notes"].map((f) => [f, (tune[f as keyof Tune] as string | null) ?? ""])));
  const [numbers, setNumbers] = useState("");
  const [msg, setMsg] = useState("");

  const patch = async (body: Record<string, unknown>) => {
    setMsg("");
    const res = await fetch(`/api/music/tunes/${tune.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? t("saved") : tc("error"));
    router.refresh();
    return res.ok;
  };

  const save = () =>
    patch(Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, k === "name" ? v.trim() : v.trim() || null])));

  const link = async () => {
    const idx = [...new Set(numbers.split(/[\s,;]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (idx.length && (await patch({ linkSongIndexes: idx }))) setNumbers("");
  };

  return (
    <div className="max-w-4xl font-ui">
      <Link href="/admin/tunes" className="text-[12px] text-forest">← {t("tunesTitle")}</Link>
      <h1 className="text-[28px] text-deep font-display m-0 mt-2 mb-4">{tune.name}</h1>

      <div className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Input key={f} id={`tune-${f}`} label={t(`field.${f}`)} value={draft[f]} onChange={(e) => setDraft({ ...draft, [f]: e.target.value })} />
        ))}
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label htmlFor="tune-notes" className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">{t("field.notes")}</label>
          <textarea id="tune-notes" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="button" onClick={save} disabled={!draft.name.trim()}>{tc("save")}</Button>
          {msg && <span role="status" className="text-[12px] text-text-muted">{msg}</span>}
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>{t("hymns")}</SectionLabel>
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          {tune.songs.map((s) => (
            <li key={s.id} className="flex items-center gap-3 text-[13px]">
              <Link href={`/songs/${s.index}`} className="text-deep">#{s.index} {s.title}</Link>
              {s.tune && <span className="text-[11px] text-text-muted truncate">{s.tune}</span>}
              <button type="button" onClick={() => patch({ unlinkSongIds: [s.id] })} className="ml-auto text-[12px] text-danger bg-transparent border-none cursor-pointer">
                {t("unlink")}
              </button>
            </li>
          ))}
          {tune.songs.length === 0 && <li className="text-[13px] text-text-muted">{t("noHymns")}</li>}
        </ul>
        <div className="flex gap-2 items-end mt-3">
          <Input id="link-numbers" label={t("linkByNumber")} placeholder="12, 45, 301" value={numbers} onChange={(e) => setNumbers(e.target.value)} />
          <Button type="button" variant="secondary" onClick={link} disabled={!numbers.trim()}>{t("link")}</Button>
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>{t("scores")}</SectionLabel>
        <ScoreList scores={tune.scores.map((s) => ({ ...s, tune: { id: tune.id, name: tune.name } }))} admin />
      </div>

      <div className="mt-8">
        <SectionLabel>{t("addScore")}</SectionLabel>
        <ScoreUpload tuneId={tune.id} tuneName={tune.name} />
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="text-[11px] text-text-muted">{t("findOnline")}</span>
          {links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-[11px] text-forest">{l.label} ↗</a>
          ))}
        </div>
      </div>
    </div>
  );
}
