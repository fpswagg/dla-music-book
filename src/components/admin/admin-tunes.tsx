"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TuneRow = { id: string; name: string; key: string | null; timeSignature: string | null; songs: number; scores: number; published: number };
type Proposal = {
  key: string;
  name: string;
  songs: Array<{ id: string; index: number; title: string; tune: string | null; tuneId: string | null }>;
  refs: Array<{ abbr: string; number: string }>;
  existingTune: { id: string; name: string } | null;
  links: Array<{ label: string; url: string }>;
};

/** Tunes (melodies) and the proposals built from the "tune" field of the hymns. */
export function AdminTunes({ tunes, proposals }: { tunes: TuneRow[]; proposals: Proposal[] }) {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const router = useRouter();
  const [tab, setTab] = useState<"tunes" | "proposals">(tunes.length ? "tunes" : "proposals");
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});

  const create = async () => {
    setError("");
    const res = await fetch("/api/music/tunes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    if (!res.ok) return setError(tc("error"));
    const { tune } = (await res.json()) as { tune: { id: string } };
    router.push(`/admin/tunes/${tune.id}`);
  };

  const accept = async (p: Proposal) => {
    setBusy(p.key);
    setError("");
    const songIds = p.songs.filter((s) => !s.tuneId && !excluded[s.id]).map((s) => s.id);
    const res = await fetch("/api/admin/tune-proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: (names[p.key] ?? p.name).trim(), songIds, existingTuneId: p.existingTune?.id }),
    });
    setBusy("");
    if (!res.ok) return setError(tc("error"));
    router.refresh();
  };

  const shown = tunes.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()));
  const tabBtn = (v: "tunes" | "proposals", label: string) => (
    <button type="button" onClick={() => setTab(v)} className={`px-3 py-1 rounded-[var(--radius-pill)] text-[12px] cursor-pointer border-none ${tab === v ? "bg-forest text-parchment" : "bg-sand text-text-body"}`}>
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl font-ui">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("tunesTitle")}</h1>
      <p className="text-[13px] text-green-muted mb-4">{t("tunesIntro")}</p>
      <div className="flex gap-2 mb-4">
        {tabBtn("tunes", t("tunesTab", { count: tunes.length }))}
        {tabBtn("proposals", t("proposalsTab", { count: proposals.length }))}
      </div>
      {error && <p role="alert" className="text-[12px] text-danger mb-3">{error}</p>}

      {tab === "tunes" ? (
        <>
          <div className="flex gap-2 items-end mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input id="tune-filter" placeholder={tc("search")} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex gap-2 items-end">
              <Input id="tune-new" placeholder={t("newTuneName")} value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="button" onClick={create} disabled={!name.trim()}>
                {t("addTune")}
              </Button>
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="text-[13px] text-text-muted">{t("noTunes")}</p>
          ) : (
            <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
              {shown.map((x) => (
                <li key={x.id}>
                  <Link href={`/admin/tunes/${x.id}`} className="flex items-center gap-3 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-2.5 no-underline hover:bg-linen">
                    <span className="flex-1 text-[14px] text-deep">{x.name}</span>
                    <span className="text-[11px] text-text-muted">{[x.key, x.timeSignature].filter(Boolean).join(" · ")}</span>
                    <span className="text-[11px] text-text-muted w-24 text-right">{t("hymnCount", { count: x.songs })}</span>
                    <span className="text-[11px] text-text-muted w-28 text-right">{t("scoreCount", { count: x.scores, published: x.published })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="text-[12px] text-text-muted mb-3">{t("proposalsIntro")}</p>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {proposals.map((p) => (
              <li key={p.key} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.existingTune ? (
                    <span className="flex-1 text-[14px] text-deep">
                      {p.existingTune.name} <span className="text-[11px] text-text-muted">({t("existing")})</span>
                    </span>
                  ) : (
                    <input value={names[p.key] ?? p.name} onChange={(e) => setNames({ ...names, [p.key]: e.target.value })} className="flex-1 min-w-[180px] bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-2 py-1 text-[14px] text-deep" aria-label={t("tune")} />
                  )}
                  <Button type="button" size="sm" disabled={busy === p.key || p.songs.every((s) => s.tuneId || excluded[s.id])} onClick={() => accept(p)}>
                    {p.existingTune ? t("linkHymns") : t("createAndLink")}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px]">
                  {p.songs.map((s) => (
                    <label key={s.id} className={`inline-flex items-center gap-1 ${s.tuneId ? "text-text-muted" : "text-text-body"}`} title={s.tune ?? ""}>
                      <input type="checkbox" disabled={!!s.tuneId} checked={!s.tuneId && !excluded[s.id]} onChange={(e) => setExcluded({ ...excluded, [s.id]: !e.target.checked })} />#{s.index} {s.title}
                    </label>
                  ))}
                </div>
                {p.refs.length > 0 && <div className="text-[11px] text-text-muted mt-1">{p.refs.map((r) => `${r.abbr} ${r.number}`).join(" · ")}</div>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-[11px] text-forest">
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
