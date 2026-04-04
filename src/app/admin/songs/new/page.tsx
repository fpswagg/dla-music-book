"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/ui/back-link";

export default function NewSongPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [index, setIndex] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "FINISHED">("DRAFT");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, index: Number(index), lyrics, status }),
      });
      if (res.ok) router.push("/admin/songs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/songs" label={tc("back")} />
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("addSong")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Input id="title" label={t("tableTitle")} value={title} onChange={e => setTitle(e.target.value)} required />
          <Input id="index" label={t("hymnNumber")} type="number" value={index} onChange={e => setIndex(e.target.value)} required />
        </div>

        <div>
          <SectionLabel>{t("tableStatus")}</SectionLabel>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStatus("DRAFT")} className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer ${status === "DRAFT" ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]" : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)]"}`}>
              {ts("draft")}
            </button>
            <button type="button" onClick={() => setStatus("FINISHED")} className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer ${status === "FINISHED" ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]" : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)]"}`}>
              {ts("finished")}
            </button>
          </div>
        </div>

        <div>
          <SectionLabel>{t("songs")}</SectionLabel>
          <textarea
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            rows={12}
            className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[15px] text-[var(--color-deep)] font-[var(--font-display)] outline-none resize-y focus:border-[var(--color-forest)] focus:bg-[var(--color-parchment)]"
            placeholder={t("lyricsPlaceholder")}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("createSong")}</Button>
          <Button variant="secondary" type="button" onClick={() => router.back()}>{tc("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
