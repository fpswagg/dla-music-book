"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TuneOption = { id: string; name: string; key: string | null; songs: number };
const KINDS = ["SATB", "MELODY", "PIANO", "OTHER"] as const;
const ACCEPT = ".musicxml,.xml,.mxl,.abc,.mei,.mid,.midi,.mscz";

/** Send a score (MusicXML, MXL, ABC, MEI, MIDI or MuseScore). It arrives as a draft for moderation. */
export function ScoreUpload({ tuneId, tuneName }: { tuneId?: string; tuneName?: string }) {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tunes, setTunes] = useState<TuneOption[]>([]);
  const [picked, setPicked] = useState<{ id: string | null; name: string } | null>(tuneId ? { id: tuneId, name: tuneName ?? "" } : null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("SATB");
  const [source, setSource] = useState("");
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (tuneId) return;
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/music/tunes?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { tunes: [] }))
        .then((d: { tunes: TuneOption[] }) => setTunes(d.tunes.slice(0, 30)))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [q, tuneId]);

  const submit = async () => {
    if (!picked || !file) return;
    setBusy(true);
    setMessage(null);
    try {
      let id = picked.id;
      if (!id) {
        const res = await fetch("/api/music/tunes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: picked.name }),
        });
        if (!res.ok) throw new Error(tc("error"));
        id = ((await res.json()) as { tune: { id: string } }).tune.id;
        setPicked({ id, name: picked.name });
      }
      const form = new FormData();
      form.set("file", file);
      form.set("tuneId", id);
      form.set("label", label.trim() || file.name.replace(/\.[^.]+$/, ""));
      form.set("kind", kind);
      if (source.trim()) form.set("source", source.trim());
      if (license.trim()) form.set("license", license.trim());
      const res = await fetch("/api/music/scores", { method: "POST", body: form });
      if (!res.ok) {
        const msg =
          res.status === 413 ? t("tooBig") : res.status === 415 ? t("badFormat") : res.status === 503 ? t("storageDown") : tc("error");
        throw new Error(msg);
      }
      const data = (await res.json()) as { score: { conversion: string } };
      setMessage({ ok: true, text: data.score.conversion === "PENDING" ? t("sentConverting") : t("sent") });
      setFile(null);
      setLabel("");
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : tc("error") });
    } finally {
      setBusy(false);
    }
  };

  const field = "bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep w-full";
  const lbl = "text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted";

  return (
    <div className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 grid gap-3 sm:grid-cols-2 font-ui">
      {!tuneId && (
        <div className="sm:col-span-2 flex flex-col gap-1">
          <span className={lbl}>{t("tune")}</span>
          {picked ? (
            <div className="flex items-center gap-2 text-[14px] text-deep">
              <span className="flex-1">
                {picked.name} {!picked.id && <span className="text-[11px] text-text-muted">({t("newTune")})</span>}
              </span>
              <button type="button" className="text-[12px] text-forest bg-transparent border-none cursor-pointer" onClick={() => setPicked(null)}>
                {t("change")}
              </button>
            </div>
          ) : (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchTune")} className={field} />
              <ul className="list-none m-0 p-0 max-h-48 overflow-auto flex flex-col gap-0.5">
                {tunes.map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => setPicked({ id: x.id, name: x.name })} className="w-full text-left px-2 py-1 rounded hover:bg-sand bg-transparent border-none cursor-pointer text-[13px]">
                      {x.name} <span className="text-[11px] text-text-muted">{[x.key, t("hymnCount", { count: x.songs })].filter(Boolean).join(" · ")}</span>
                    </button>
                  </li>
                ))}
                {q.trim() && !tunes.some((x) => x.name.toLowerCase() === q.trim().toLowerCase()) && (
                  <li>
                    <button type="button" onClick={() => setPicked({ id: null, name: q.trim() })} className="w-full text-left px-2 py-1 rounded hover:bg-sand bg-transparent border-none cursor-pointer text-[13px] text-forest">
                      + {t("createTune", { name: q.trim() })}
                    </button>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label htmlFor="score-file" className={lbl}>{t("file")}</label>
        <input id="score-file" type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
        <span className="text-[11px] text-text-muted">{t("formats")}</span>
      </div>
      <Input id="score-label" label={t("label")} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelHint")} />
      <div className="flex flex-col gap-1">
        <label htmlFor="score-kind" className={lbl}>{t("kind")}</label>
        <select id="score-kind" value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])} className={field}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kinds.${k}`)}
            </option>
          ))}
        </select>
      </div>
      <Input id="score-source" label={t("source")} value={source} onChange={(e) => setSource(e.target.value)} placeholder={t("sourceHint")} />
      <Input id="score-license" label={t("license")} value={license} onChange={(e) => setLicense(e.target.value)} placeholder={t("licenseHint")} />
      <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
        <Button type="button" onClick={submit} disabled={busy || !picked || !file}>
          {busy ? t("sending") : t("send")}
        </Button>
        {message && (
          <span role="status" className={`text-[12px] ${message.ok ? "text-forest" : "text-danger"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
