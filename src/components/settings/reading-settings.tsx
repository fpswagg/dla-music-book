"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Type } from "lucide-react";
import { usePreferences, type Preferences } from "@/components/providers/preferences";

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

/** Font size, theme, refrain repeats: the reader's knobs, next to the hymn. */
export function ReadingSettings({ className = "" }: { className?: string }) {
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
        className={className}
      >
        <Type size={16} aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[300px] z-[70] bg-parchment border-[0.5px] border-stone rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-4 text-left">
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
        </div>
      )}
    </div>
  );
}
