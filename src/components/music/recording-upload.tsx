"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Send an audio recording of a hymn. Big files go in 4 MB pieces (the site's request limit);
 * the server joins them, then analyses the recording. It stays a draft until an admin checks it.
 */
export function RecordingUpload({ songIndex: fixedIndex }: { songIndex?: number }) {
  const t = useTranslations("recordings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [songIndex, setSongIndex] = useState(fixedIndex ? String(fixedIndex) : "");
  const [title, setTitle] = useState("");
  const [performer, setPerformer] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!file) return;
    setMessage(null);
    setProgress(0);
    let id: string | null = null;
    try {
      const res = await fetch("/api/music/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          size: file.size,
          contentType: file.type || undefined,
          songIndex: songIndex ? Number(songIndex) : null,
          title: title.trim() || undefined,
          performer: performer.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(
          res.status === 413 ? t("tooBig") : res.status === 415 ? t("badFormat") : res.status === 404 ? t("unknownHymn") : res.status === 503 ? t("storageDown") : tc("error"),
        );
      }
      const start = (await res.json()) as { id: string; chunkBytes: number; chunks: number };
      id = start.id;
      for (let n = 0; n < start.chunks; n++) {
        const body = file.slice(n * start.chunkBytes, (n + 1) * start.chunkBytes);
        let ok = false;
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          const r = await fetch(`/api/music/recordings/${id}/chunks/${n}`, { method: "PUT", body, headers: { "Content-Type": "application/octet-stream" } }).catch(() => null);
          ok = !!r?.ok;
        }
        if (!ok) throw new Error(t("uploadFailed"));
        setProgress(Math.round(((n + 1) / start.chunks) * 100));
      }
      const done = await fetch(`/api/music/recordings/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunks: start.chunks }),
      });
      if (!done.ok) throw new Error(t("uploadFailed"));
      id = null;
      setMessage({ ok: true, text: t("sent") });
      setFile(null);
      setTitle("");
      router.refresh();
    } catch (err) {
      if (id) await fetch(`/api/music/recordings/${id}`, { method: "DELETE" }).catch(() => {});
      setMessage({ ok: false, text: err instanceof Error ? err.message : tc("error") });
    } finally {
      setProgress(null);
    }
  };

  const lbl = "text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted";
  const busy = progress !== null;

  return (
    <div className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 grid gap-3 sm:grid-cols-2 font-ui">
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label htmlFor="rec-file" className={lbl}>{t("file")}</label>
        <input id="rec-file" type="file" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
        <span className="text-[11px] text-text-muted">{t("formats")}</span>
      </div>
      {!fixedIndex && (
        <Input id="rec-hymn" type="number" min={1} label={t("hymnNumber")} value={songIndex} onChange={(e) => setSongIndex(e.target.value)} placeholder={t("hymnNumberHint")} />
      )}
      <Input id="rec-title" label={t("title")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titleHint")} />
      <Input id="rec-performer" label={t("performer")} value={performer} onChange={(e) => setPerformer(e.target.value)} placeholder={t("performerHint")} />
      <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
        <Button type="button" onClick={submit} disabled={busy || !file}>
          {busy ? t("sending", { pct: progress }) : t("send")}
        </Button>
        {busy && (
          <div className="flex-1 min-w-32 h-1.5 bg-sand rounded-full overflow-hidden" aria-hidden>
            <div className="h-full bg-forest transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
        {message && (
          <span role="status" className={`text-[12px] ${message.ok ? "text-forest" : "text-danger"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
