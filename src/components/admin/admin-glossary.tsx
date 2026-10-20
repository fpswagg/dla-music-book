"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Term = { id: string; term: string; note: string | null };

/** Duala words given to the transcription and to Claude's correction (names, rare words, spellings). */
export function AdminGlossary({ terms }: { terms: Term[] }) {
  const t = useTranslations("recordings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: term.trim(), note: note.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) return setError(tc("error"));
    setTerm("");
    setNote("");
    router.refresh();
  };
  const remove = async (id: string) => {
    await fetch(`/api/admin/glossary/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="font-ui flex flex-col gap-3">
      <p className="text-[12px] text-text-muted m-0">{t("glossaryHelp")}</p>
      <div className="flex gap-2 items-end flex-wrap">
        <Input id="gl-term" label={t("term")} value={term} onChange={(e) => setTerm(e.target.value)} lang="dua" />
        <Input id="gl-note" label={t("termNote")} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="button" onClick={add} disabled={busy || !term.trim()}>
          {tc("add")}
        </Button>
      </div>
      {error && <p role="alert" className="text-[12px] text-danger m-0">{error}</p>}
      {terms.length ? (
        <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">
          {terms.map((x) => (
            <li key={x.id} className="inline-flex items-center gap-1 bg-linen border-[0.5px] border-stone rounded-[var(--radius-pill)] pl-3 pr-1 py-0.5 text-[13px]">
              <span className="font-display text-deep" title={x.note ?? undefined}>{x.term}</span>
              <button type="button" aria-label={`${tc("remove")} ${x.term}`} onClick={() => remove(x.id)} className="bg-transparent border-none cursor-pointer text-text-muted px-1">
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-text-muted m-0">{t("glossaryEmpty")}</p>
      )}
    </div>
  );
}
