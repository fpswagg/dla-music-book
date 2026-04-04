"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full sm:max-w-xs bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-[var(--font-ui)] text-[var(--color-text-body)] focus:border-[var(--color-forest)] focus:outline-none";
const selectCls =
  "bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-2 py-2 text-[12px] font-[var(--font-ui)] text-[var(--color-text-body)] focus:border-[var(--color-forest)] focus:outline-none min-w-[8rem]";

function useAdminQueryPush(basePath: string) {
  const router = useRouter();
  const sp = useSearchParams();

  const pushParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      p.delete("page");
      const qs = p.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [basePath, router, sp],
  );

  return { pushParams, sp };
}

export function AdminSongsListToolbar() {
  const t = useTranslations("admin");
  const ts = useTranslations("status");
  const tc = useTranslations("common");
  const { pushParams, sp } = useAdminQueryPush("/admin/songs");
  const qVal = sp.get("q") ?? "";
  const [localQ, setLocalQ] = useState(qVal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLocalQ(qVal), [qVal]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      pushParams({ q: localQ.trim() || undefined });
    });
  }

  const statusVal = sp.get("status") ?? "";

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        onSubmit={submitSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 min-w-0"
      >
        <input
          type="search"
          className={inputCls}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("listSearchPlaceholder")}
          aria-label={t("listSearchPlaceholder")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isPending} className="shrink-0 w-full sm:w-auto">
          {tc("search")}
        </Button>
      </form>
      <select
        className={selectCls}
        value={statusVal}
        onChange={(e) =>
          startTransition(() =>
            pushParams({ status: e.target.value || undefined }),
          )
        }
        aria-label={t("filterStatus")}
      >
        <option value="">{t("allStatuses")}</option>
        <option value="DRAFT">{ts("draft")}</option>
        <option value="FINISHED">{ts("finished")}</option>
      </select>
    </div>
  );
}

export function AdminTagsListToolbar() {
  const t = useTranslations("admin");
  const tc = useTranslations("tagCategory");
  const tco = useTranslations("common");
  const { pushParams, sp } = useAdminQueryPush("/admin/tags");
  const qVal = sp.get("q") ?? "";
  const [localQ, setLocalQ] = useState(qVal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLocalQ(qVal), [qVal]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      pushParams({ q: localQ.trim() || undefined });
    });
  }

  const cat = sp.get("category") ?? "";

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        onSubmit={submitSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 min-w-0"
      >
        <input
          type="search"
          className={inputCls}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("listSearchPlaceholder")}
          aria-label={t("listSearchPlaceholder")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isPending} className="shrink-0 w-full sm:w-auto">
          {tco("search")}
        </Button>
      </form>
      <select
        className={selectCls}
        value={cat}
        onChange={(e) =>
          startTransition(() =>
            pushParams({ category: e.target.value || undefined }),
          )
        }
        aria-label={t("filterCategory")}
      >
        <option value="">{t("allStatuses")}</option>
        <option value="MOOD">{tc("MOOD")}</option>
        <option value="THEME">{tc("THEME")}</option>
        <option value="STYLE">{tc("STYLE")}</option>
        <option value="ERA">{tc("ERA")}</option>
      </select>
    </div>
  );
}

export function AdminCollectionsListToolbar() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { pushParams, sp } = useAdminQueryPush("/admin/collections");
  const qVal = sp.get("q") ?? "";
  const [localQ, setLocalQ] = useState(qVal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLocalQ(qVal), [qVal]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      pushParams({ q: localQ.trim() || undefined });
    });
  }

  const st = sp.get("status") ?? "";

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        onSubmit={submitSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 min-w-0"
      >
        <input
          type="search"
          className={inputCls}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("listSearchPlaceholder")}
          aria-label={t("listSearchPlaceholder")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isPending} className="shrink-0 w-full sm:w-auto">
          {tc("search")}
        </Button>
      </form>
      <select
        className={selectCls}
        value={st}
        onChange={(e) =>
          startTransition(() =>
            pushParams({ status: e.target.value || undefined }),
          )
        }
        aria-label={t("collectionStatus")}
      >
        <option value="">{t("allStatuses")}</option>
        <option value="PRIVATE">{t("private")}</option>
        <option value="PUBLIC">{t("public")}</option>
        <option value="PENDING_REVIEW">{t("pending")}</option>
      </select>
    </div>
  );
}

export function AdminAuthorsListToolbar() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { pushParams, sp } = useAdminQueryPush("/admin/authors");
  const qVal = sp.get("q") ?? "";
  const [localQ, setLocalQ] = useState(qVal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLocalQ(qVal), [qVal]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      pushParams({ q: localQ.trim() || undefined });
    });
  }

  return (
    <div className="mb-4">
      <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          className={inputCls}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("listSearchPlaceholder")}
          aria-label={t("listSearchPlaceholder")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isPending} className="shrink-0 w-full sm:w-auto">
          {tc("search")}
        </Button>
      </form>
    </div>
  );
}

export function AdminUsersListToolbar() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { pushParams, sp } = useAdminQueryPush("/admin/users");
  const qVal = sp.get("q") ?? "";
  const [localQ, setLocalQ] = useState(qVal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setLocalQ(qVal), [qVal]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      pushParams({ q: localQ.trim() || undefined });
    });
  }

  return (
    <div className="mb-4">
      <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          className={inputCls}
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("listSearchPlaceholder")}
          aria-label={t("listSearchPlaceholder")}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={isPending} className="shrink-0 w-full sm:w-auto">
          {tc("search")}
        </Button>
      </form>
    </div>
  );
}
