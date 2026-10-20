"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Help = {
  song: { id: string; tune: string | null; tuneId: string | null };
  clean: { name: string | null; refs: Array<{ abbr: string; number: string }>; ownMelody: boolean };
  matches: Array<{ id: string; name: string }>;
  links: Array<{ label: string; url: string; query: string }>;
};

/** Song editor: which tune (and so which scores) this hymn uses, with search links to find a score. */
export function SongTunePanel({ help, current }: { help: Help; current: { id: string; name: string; scores: number } | null }) {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const attach = async (existingTuneId?: string) => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/tune-proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: help.clean.name ?? "", songIds: [help.song.id], existingTuneId }),
    });
    setBusy(false);
    if (!res.ok) return setError(tc("error"));
    router.refresh();
  };

  return (
    <section className="mt-10 bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 font-ui">
      <h2 className="text-[16px] text-deep font-display m-0 mb-2">{t("tuneAndScores")}</h2>
      {current ? (
        <p className="text-[13px] m-0">
          <Link href={`/admin/tunes/${current.id}`} className="text-forest">{current.name}</Link>
          <span className="text-text-muted"> · {t("scoreCount", { count: current.scores, published: current.scores })}</span>
        </p>
      ) : (
        <div className="flex flex-col gap-2 text-[13px]">
          <p className="m-0 text-text-muted">{help.clean.name ? t("suggested", { name: help.clean.name }) : help.clean.ownMelody ? t("ownMelody") : t("noTuneField")}</p>
          <div className="flex gap-2 flex-wrap">
            {help.matches.map((m) => (
              <Button key={m.id} size="sm" type="button" disabled={busy} onClick={() => attach(m.id)}>
                {t("linkTo", { name: m.name })}
              </Button>
            ))}
            {help.clean.name && help.matches.length === 0 && (
              <Button size="sm" type="button" disabled={busy} onClick={() => attach()}>
                {t("createTune", { name: help.clean.name })}
              </Button>
            )}
            <Link href="/admin/tunes" className="text-[12px] text-forest self-center">{t("allTunes")}</Link>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-[12px] text-danger mt-2 mb-0">{error}</p>}
      {help.links.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">{t("findOnline")}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {help.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-[11px] text-forest">
                {l.label} · {l.query} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
