"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SearchBar } from "@/components/ui/search-bar";
import { FilterPill } from "@/components/ui/filter-pill";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { ListPendingOverlay } from "@/components/ui/list-pending-overlay";
import { Button } from "@/components/ui/button";

interface Props {
  initialQuery: string;
  tags: Array<{ id: string; key?: string; name: string | Record<string, string>; category: string }>;
  languages: Array<{ id: string; code: string; name: string | Record<string, string> }>;
  activeLang: string;
  activeTag: string;
}

export function SongCatalogClient({
  initialQuery,
  tags,
  languages,
  activeLang,
  activeTag,
}: Props) {
  const t = useTranslations("songs");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftQuery(initialQuery);
  }, [initialQuery]);

  const pushUrl = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `/songs?${qs}` : "/songs");
      });
    },
    [router],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("mood");
      params.delete("page");
      pushUrl(params);
    },
    [searchParams, pushUrl],
  );

  function applySearchQuery(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("mood");
    params.delete("page");
    pushUrl(params);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applySearchQuery(draftQuery);
  }

  const moodTags = tags.filter((x) => x.category === "MOOD");
  const otherTags = tags.filter((x) => x.category !== "MOOD");

  const clearTagFilter = () => updateParams({ tag: undefined });

  return (
    <ListPendingOverlay pending={isPending} namespace="songs">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={draftQuery}
              onChange={setDraftQuery}
              placeholder={t("searchPlaceholder")}
            />
          </div>
          <Button type="submit" variant="secondary" className="shrink-0 w-full sm:w-auto">
            {t("search")}
          </Button>
        </form>
        {activeTag && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-wider">
              {t("tagFilter")}
            </span>
            <FilterPill
              label={
                getTranslatedName(
                  tags.find((x) => x.key === activeTag)?.name ?? { fr: activeTag },
                  locale,
                ) || activeTag
              }
              active
              onClick={clearTagFilter}
            />
            <button
              type="button"
              onClick={clearTagFilter}
              className="text-[12px] text-[var(--color-forest)] font-[var(--font-ui)] bg-transparent border-none cursor-pointer underline"
            >
              {t("clearTag")}
            </button>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-wider mr-2">
              {t("language")}
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {languages.map((l) => (
                <FilterPill
                  key={l.code}
                  label={getTranslatedName(l.name, locale)}
                  active={activeLang === l.code}
                  onClick={() =>
                    updateParams({ lang: activeLang === l.code ? undefined : l.code })
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-wider mr-2">
              {t("mood")}
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {moodTags.map((tag) => {
                const filterKey = tag.key ?? "";
                return (
                  <FilterPill
                    key={filterKey}
                    label={getTranslatedName(tag.name, locale)}
                    active={activeTag === filterKey}
                    onClick={() =>
                      updateParams({
                        tag: activeTag === filterKey ? undefined : filterKey,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
          {otherTags.length > 0 && (
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] uppercase tracking-wider mr-2">
                {t("tagFilter")}
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {otherTags.map((tag) => {
                  const filterKey = tag.key ?? "";
                  return (
                    <FilterPill
                      key={filterKey}
                      label={getTranslatedName(tag.name, locale)}
                      active={activeTag === filterKey}
                      onClick={() =>
                        updateParams({
                          tag: activeTag === filterKey ? undefined : filterKey,
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ListPendingOverlay>
  );
}
