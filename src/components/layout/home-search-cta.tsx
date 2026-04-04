"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export function HomeSearchCta() {
  const t = useTranslations("home");
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    const href = trimmed ? `/songs?q=${encodeURIComponent(trimmed)}` : "/songs";
    router.push(href);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl mx-auto flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-1 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)]"
    >
      <div className="flex flex-1 items-center gap-2 min-w-0 px-3 py-2">
        <Search size={18} className="text-[var(--color-forest)] shrink-0" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] text-[var(--color-deep)] font-[var(--font-ui)] placeholder:text-[var(--color-text-muted)]"
          autoComplete="off"
          enterKeyHint="search"
          aria-label={t("searchPlaceholder")}
        />
      </div>
      <button
        type="submit"
        className="shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-[var(--font-ui)] border-none cursor-pointer hover:bg-[var(--color-deep)] transition-colors"
      >
        <Search size={16} aria-hidden />
        {t("searchCta")}
      </button>
    </form>
  );
}
