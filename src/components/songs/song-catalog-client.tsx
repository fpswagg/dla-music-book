"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/ui/search-bar";
import { FilterPill } from "@/components/ui/filter-pill";

interface Props {
  initialQuery: string;
  tags: Array<{ id: string; name: string; category: string }>;
  languages: Array<{ id: string; code: string; name: string }>;
  activeLang: string;
  activeMood: string;
}

export function SongCatalogClient({ initialQuery, tags, languages, activeLang, activeMood }: Props) {
  const t = useTranslations("songs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/songs?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateParams("q", val), 300);
    },
    [updateParams]
  );

  const moodTags = tags.filter((t) => t.category === "MOOD");

  return (
    <div className="flex flex-col gap-4">
      <SearchBar value={query} onChange={handleSearch} placeholder={t("searchPlaceholder")} />
      <div className="flex flex-wrap gap-2">
        {languages.map((l) => (
          <FilterPill
            key={l.code}
            label={l.name}
            active={activeLang === l.code}
            onClick={() => updateParams("lang", activeLang === l.code ? "" : l.code)}
          />
        ))}
        <div className="w-[0.5px] bg-[var(--color-stone)] mx-1" />
        {moodTags.map((t) => (
          <FilterPill
            key={t.name}
            label={t.name}
            active={activeMood === t.name}
            onClick={() => updateParams("mood", activeMood === t.name ? "" : t.name)}
          />
        ))}
      </div>
    </div>
  );
}
