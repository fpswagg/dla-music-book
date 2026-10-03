"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function nextSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toISOString().slice(0, 10);
}

export function NewProgrammeForm() {
  const t = useTranslations("programmes");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(nextSunday);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/setlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || t("defaultTitle"), date: date || null }),
      });
      if (res.ok) {
        const { id } = (await res.json()) as { id: string };
        router.push(`/dashboard/programmes/${id}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-linen border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <Input id="prog-title" label={t("titleLabel")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("defaultTitle")} />
      <Input id="prog-date" label={t("dateLabel")} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button type="submit" disabled={busy} className="min-h-[42px]">
        <Plus size={15} /> {t("create")}
      </Button>
    </form>
  );
}
