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
      className="w-full max-w-xl mx-auto flex flex-row items-stretch overflow-hidden rounded-[var(--radius-md)] border-[0.5px] border-[var(--color-stone)] bg-[var(--color-linen)]
        md:flex-col md:gap-2 md:overflow-visible md:p-1.5
        lg:flex-row lg:items-center lg:gap-2"
    >
      <div className="flex flex-1 items-center gap-2 min-w-0 pl-3 pr-2 py-2.5 min-h-[48px] md:min-h-0 md:px-3 md:py-2">
        <Search size={18} className="text-[var(--color-forest)] shrink-0" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] md:text-[15px] text-[var(--color-deep)] font-[var(--font-ui)] placeholder:text-[var(--color-text-muted)]"
          autoComplete="off"
          enterKeyHint="search"
          aria-label={t("searchPlaceholder")}
        />
      </div>
      <button
        type="submit"
        aria-label={t("searchCta")}
        className="shrink-0 inline-flex items-center justify-center gap-2 border-none cursor-pointer bg-[var(--color-forest)] text-[var(--color-parchment)] transition-colors hover:bg-[var(--color-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-forest)] text-[13px] font-[var(--font-ui)]
          min-w-[3.25rem] px-1 max-md:rounded-none max-md:rounded-r-[var(--radius-md)]
          md:min-h-[44px] md:w-full md:rounded-[var(--radius-md)] md:px-5 md:py-2.5
          lg:min-h-0 lg:w-auto lg:px-5 lg:py-2.5"
      >
        <Search size={20} className="md:hidden" aria-hidden />
        <Search size={16} className="hidden md:inline" aria-hidden />
        <span className="hidden md:inline">{t("searchCta")}</span>
      </button>
    </form>
  );
}
