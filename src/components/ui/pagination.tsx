"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SearchParamsLike = Record<string, string | string[] | undefined>;

function buildHref(
  pathname: string,
  searchParams: SearchParamsLike,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value !== "") {
      params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Pagination({
  pathname,
  searchParams,
  page,
  total,
  pageSize,
}: {
  pathname: string;
  searchParams: SearchParamsLike;
  page: number;
  total: number;
  pageSize: number;
}) {
  const t = useTranslations("pagination");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 1) return null;

  const prev = safePage > 1 ? safePage - 1 : null;
  const next = safePage < totalPages ? safePage + 1 : null;

  const go = (targetPage: number) => {
    const href = buildHref(pathname, searchParams, targetPage);
    startTransition(() => router.push(href));
  };

  const linkCls =
    "inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-[var(--radius-md)] border-[0.5px] border-[var(--color-stone)] bg-[var(--color-linen)] text-[13px] text-[var(--color-deep)] font-[var(--font-ui)] hover:bg-[var(--color-sand)] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-forest)]";
  const disabledCls =
    "inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-[var(--radius-md)] border-[0.5px] border-[var(--color-stone)] text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)] opacity-50 pointer-events-none";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 mt-8"
      aria-label={t("label")}
      aria-busy={isPending}
    >
      {prev ? (
        <button
          type="button"
          onClick={() => go(prev)}
          disabled={isPending}
          className={`${linkCls} no-underline disabled:opacity-60`}
        >
          <ChevronLeft size={16} className="shrink-0" aria-hidden />
          {t("prev")}
        </button>
      ) : (
        <span className={disabledCls}>
          <ChevronLeft size={16} className="shrink-0" aria-hidden />
          {t("prev")}
        </span>
      )}

      <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)] px-2 tabular-nums">
        {t("pageOf", { page: safePage, totalPages })}
      </span>

      {next ? (
        <button
          type="button"
          onClick={() => go(next)}
          disabled={isPending}
          className={`${linkCls} no-underline disabled:opacity-60`}
        >
          {t("next")}
          <ChevronRight size={16} className="shrink-0" aria-hidden />
        </button>
      ) : (
        <span className={disabledCls}>
          {t("next")}
          <ChevronRight size={16} className="shrink-0" aria-hidden />
        </span>
      )}
    </nav>
  );
}
