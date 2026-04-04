"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/ui/search-bar";
import { ListPendingOverlay } from "@/components/ui/list-pending-overlay";
import { Button } from "@/components/ui/button";

export function CollectionsSearchClient({ initialQ }: { initialQ: string }) {
  const t = useTranslations("collections");
  const router = useRouter();
  const [draft, setDraft] = useState(initialQ);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(initialQ);
  }, [initialQ]);

  const submit = useCallback(
    (q: string) => {
      startTransition(() => {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        const qs = params.toString();
        router.push(qs ? `/collections?${qs}` : "/collections");
      });
    },
    [router],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <ListPendingOverlay pending={isPending} namespace="collections" className="mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
        <div className="flex-1 min-w-0">
          <SearchBar
            value={draft}
            onChange={setDraft}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <Button type="submit" variant="secondary" className="shrink-0 w-full sm:w-auto">
          {t("search")}
        </Button>
      </form>
    </ListPendingOverlay>
  );
}
