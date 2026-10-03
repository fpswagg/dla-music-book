"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { parseReferences } from "@/lib/references";

export type HymnalOption = { id: string; code: string; name: string; aliases: string[] };
export type ReferenceRow = { hymnalId: string; number: string };

/** Cross-references (hymnal + number); paste a line from the book to fill it. */
export function ReferencesEditor({
  hymnals,
  value,
  onChange,
}: {
  hymnals: HymnalOption[];
  value: ReferenceRow[];
  onChange: (rows: ReferenceRow[]) => void;
}) {
  const t = useTranslations("referencesEditor");
  const [line, setLine] = useState("");
  const [unknown, setUnknown] = useState<string[]>([]);
  const input = "bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep outline-none focus:border-forest";

  if (!hymnals.length) return <p className="text-[12px] text-text-muted m-0">{t("noHymnals")}</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={line} onChange={(e) => setLine(e.target.value)} placeholder={t("pastePlaceholder")} className={`${input} flex-1 min-w-0 font-display`} />
        <button
          type="button"
          onClick={() => {
            const refs = parseReferences(line, hymnals);
            setUnknown(refs.filter((r) => !r.hymnalId).map((r) => r.code));
            const rows = refs.filter((r) => r.hymnalId).map((r) => ({ hymnalId: r.hymnalId!, number: r.number }));
            if (rows.length) {
              onChange([...value, ...rows]);
              setLine("");
            }
          }}
          className="px-3 rounded-[var(--radius-md)] bg-sand border-none text-[12px] text-deep cursor-pointer"
        >
          {t("parse")}
        </button>
      </div>
      {unknown.length > 0 && <p className="text-[12px] text-danger m-0">{t("unknown", { codes: unknown.join(", ") })}</p>}
      {value.map((r, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select value={r.hymnalId} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, hymnalId: e.target.value } : x)))} className={`${input} flex-1 min-w-0`}>
            {hymnals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.code} — {h.name}
              </option>
            ))}
          </select>
          <input value={r.number} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, number: e.target.value.trim() } : x)))} className={`${input} w-24`} aria-label={t("number")} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t("remove")} className="p-2 bg-transparent border-none cursor-pointer text-text-muted hover:text-danger">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { hymnalId: hymnals[0].id, number: "" }])} className="self-start inline-flex items-center gap-1 bg-transparent border-none text-[12px] text-forest cursor-pointer px-0">
        <Plus size={14} /> {t("add")}
      </button>
    </div>
  );
}
