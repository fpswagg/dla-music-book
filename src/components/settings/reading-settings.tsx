"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";
import { usePreferences, type Preferences } from "@/components/providers/preferences";
import { OfflineToggle } from "@/components/offline/offline-toggle";

function Segmented<K extends keyof Preferences>({
  name,
  label,
  options,
}: {
  name: K;
  label: string;
  options: Array<{ value: Preferences[K]; label: string }>;
}) {
  const { prefs, setPrefs } = usePreferences();
  return (
    <fieldset className="border-none p-0 m-0">
      <legend className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted mb-1.5">{label}</legend>
      <div className="flex gap-1 bg-linen rounded-[var(--radius-md)] p-1">
        {options.map((o) => {
          const active = prefs[name] === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => setPrefs({ [name]: o.value } as Partial<Preferences>)}
              className={`flex-1 min-h-[36px] px-2 rounded-[var(--radius-sm)] text-[12px] border-none cursor-pointer transition-colors ${
                active ? "bg-parchment text-deep font-medium" : "bg-transparent text-text-muted hover:text-deep"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Font size, theme, refrain repeats, offline — the reader's knobs. */
export function ReadingSettings() {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("title")}
        title={t("title")}
        className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-pill)] border-[0.5px] border-stone bg-parchment text-deep cursor-pointer hover:bg-sand transition-colors"
      >
        <Settings2 size={17} aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(88vw,300px)] z-[70] bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] p-4 flex flex-col gap-4">
          <Segmented
            name="text"
            label={t("textSize")}
            options={[
              { value: "sm", label: "A" },
              { value: "md", label: "A+" },
              { value: "lg", label: "A++" },
              { value: "xl", label: "A+++" },
            ]}
          />
          <Segmented
            name="theme"
            label={t("theme")}
            options={[
              { value: "light", label: t("light") },
              { value: "dark", label: t("dark") },
              { value: "system", label: t("system") },
            ]}
          />
          <Segmented
            name="refrain"
            label={t("refrain")}
            options={[
              { value: "full", label: t("refrainFull") },
              { value: "short", label: t("refrainShort") },
            ]}
          />
          <OfflineToggle />
        </div>
      )}
    </div>
  );
}
