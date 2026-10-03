"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ListPlus, Plus } from "lucide-react";

type Row = { id: string; title: string; date: string | null };

/** Hymn page button: add this hymn to one of my service programmes. */
export function AddToProgramme({ songId, index }: { songId: string; index: number }) {
  const t = useTranslations("programmes");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/dashboard/setlists")
      .then((r) => (r.ok ? r.json() : { setlists: [] }))
      .then((d: { setlists: Row[] }) => setRows(d.setlists))
      .catch(() => setRows([]));
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const add = async (id: string) => {
    const res = await fetch(`/api/dashboard/setlists/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId }),
    });
    if (res.ok) setDone(id);
  };

  const create = async () => {
    const res = await fetch("/api/dashboard/setlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t("defaultTitle"), date: new Date().toISOString().slice(0, 10), items: [{ songId, stanzas: [] }] }),
    });
    if (res.ok) {
      const { id } = (await res.json()) as { id: string };
      router.push(`/dashboard/programmes/${id}`);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[var(--radius-md)] text-[13px] text-text-body bg-transparent border-[0.5px] border-stone cursor-pointer hover:bg-sand"
      >
        <ListPlus size={15} /> {t("addTo")}
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[min(86vw,280px)] z-50 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] p-2 text-left">
          <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0 px-2 py-1.5">{t("addHymn", { n: index })}</p>
          {rows === null && <p className="text-[12px] text-text-muted px-2 py-2 m-0">…</p>}
          {rows?.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => add(r.id)}
              disabled={done === r.id}
              className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-[var(--radius-sm)] text-[13px] text-deep bg-transparent border-none cursor-pointer hover:bg-sand text-left"
            >
              <span className="truncate">
                {r.title}
                {r.date && <span className="text-text-muted"> · {r.date}</span>}
              </span>
              {done === r.id && <Check size={14} className="text-forest shrink-0" />}
            </button>
          ))}
          <button type="button" onClick={create} className="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-[var(--radius-sm)] text-[13px] text-forest bg-transparent border-none cursor-pointer hover:bg-sand">
            <Plus size={14} /> {t("newWithHymn")}
          </button>
          {done && (
            <Link href={`/dashboard/programmes/${done}`} className="block px-2 py-1.5 text-[12px] text-forest">
              {t("openProgramme")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
