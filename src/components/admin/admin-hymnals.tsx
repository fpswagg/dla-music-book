"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HymnalView } from "@/lib/data-provider";

type Draft = { code: string; name: string; description: string; aliases: string; sortOrder: string };
const empty: Draft = { code: "", name: "", description: "", aliases: "", sortOrder: "0" };
const toDraft = (h: HymnalView): Draft => ({
  code: h.code,
  name: h.name,
  description: h.description ?? "",
  aliases: h.aliases.join(", "),
  sortOrder: String(h.sortOrder),
});

/** Hymnals cited under hymn numbers ("M.B.", "S. S. et S."…): the legend shown on /hymnals. */
export function AdminHymnals({ hymnals }: { hymnals: HymnalView[] }) {
  const t = useTranslations("adminHymnals");
  const tc = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState("");

  const body = (d: Draft) => ({
    code: d.code.trim(),
    name: d.name.trim(),
    description: d.description.trim() || null,
    aliases: d.aliases.split(",").map((a) => a.trim()).filter(Boolean),
    sortOrder: Number(d.sortOrder) || 0,
  });

  const save = async () => {
    setError("");
    const res = await fetch(editing && editing !== "new" ? `/api/admin/hymnals/${editing}` : "/api/admin/hymnals", {
      method: editing && editing !== "new" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body(draft)),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error === "CODE_TAKEN" ? t("codeTaken") : (data.error ?? tc("error")));
      return;
    }
    setEditing(null);
    setDraft(empty);
    router.refresh();
  };

  const remove = async (h: HymnalView) => {
    if (!confirm(tc("confirm"))) return;
    const res = await fetch(`/api/admin/hymnals/${h.id}`, { method: "DELETE" });
    if (!res.ok) setError(t("inUse", { count: h.songCount }));
    router.refresh();
  };

  const form = (
    <div className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 grid gap-3 sm:grid-cols-2">
      <Input id="code" label={t("code")} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="S. S. et S." />
      <Input id="name" label={t("name")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Sacred Songs and Solos" />
      <Input id="aliases" label={t("aliases")} value={draft.aliases} onChange={(e) => setDraft({ ...draft, aliases: e.target.value })} placeholder="SS&S, S.S.S." />
      <Input id="order" label={t("order")} type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
      <div className="sm:col-span-2 flex flex-col gap-1">
        <label htmlFor="desc" className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">{t("description")}</label>
        <textarea id="desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep" />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <Button type="button" onClick={save} disabled={!draft.code.trim() || !draft.name.trim()}>{tc("save")}</Button>
        <Button type="button" variant="ghost" onClick={() => { setEditing(null); setDraft(empty); }}>{tc("cancel")}</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h1 className="text-[28px] text-deep font-display m-0">{t("title")}</h1>
        {editing === null && (
          <Button size="sm" onClick={() => { setEditing("new"); setDraft(empty); }}>{t("add")}</Button>
        )}
      </div>
      <p className="text-[13px] text-green-muted mb-5">{t("intro")}</p>
      {error && <p role="alert" className="text-[12px] text-danger mb-3">{error}</p>}
      {editing === "new" && <div className="mb-4">{form}</div>}
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {hymnals.map((h) =>
          editing === h.id ? (
            <li key={h.id}>{form}</li>
          ) : (
            <li key={h.id} className="flex items-start gap-4 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3">
              <span className="font-display text-[18px] text-deep w-28 shrink-0">{h.code}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] text-text-body">{h.name}</span>
                <span className="block text-[11px] text-text-muted">
                  {t("usage", { count: h.songCount })}
                  {h.aliases.length > 0 && ` · ${h.aliases.join(", ")}`}
                </span>
              </span>
              <button type="button" className="text-[12px] text-forest bg-transparent border-none cursor-pointer" onClick={() => { setEditing(h.id); setDraft(toDraft(h)); }}>{tc("edit")}</button>
              <button type="button" className="text-[12px] text-danger bg-transparent border-none cursor-pointer" onClick={() => remove(h)}>{tc("delete")}</button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
