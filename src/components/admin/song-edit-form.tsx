"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import type { SongWithRelations } from "@/lib/data-provider";

export function SongEditForm({ song }: { song: SongWithRelations }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const router = useRouter();
  const [title, setTitle] = useState(song.title);
  const [status, setStatus] = useState(song.status);
  const [lyrics, setLyrics] = useState(song.versions[0]?.lyrics ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, lyrics }),
      });
      if (res.ok) router.push("/admin/songs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Input id="title" label={t("tableTitle")} value={title} onChange={e => setTitle(e.target.value)} required />
        <Input id="index" label={t("hymnNumber")} type="number" value={String(song.index)} disabled />
      </div>

      <div>
        <SectionLabel>{t("tableStatus")}</SectionLabel>
        <div className="flex gap-2">
          {(["DRAFT", "FINISHED"] as const).map(s => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer ${status === s ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]" : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)]"}`}>
              {ts(s.toLowerCase() as "draft" | "finished")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>{t("songs")}</SectionLabel>
        <textarea
          value={lyrics}
          onChange={e => setLyrics(e.target.value)}
          rows={14}
          className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[15px] text-[var(--color-deep)] font-[var(--font-display)] outline-none resize-y focus:border-[var(--color-forest)] focus:bg-[var(--color-parchment)]"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveChanges")}</Button>
        <Button variant="secondary" type="button" onClick={() => router.back()}>{tc("cancel")}</Button>
      </div>
    </form>
  );
}
