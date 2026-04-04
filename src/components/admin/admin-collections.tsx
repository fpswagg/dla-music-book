"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TranslatedTextField, type TranslatedStrings } from "@/components/ui/translated-text-field";
import type { Locale } from "@/i18n/config";
import { AdminCollectionsListToolbar } from "@/components/admin/admin-list-toolbar";

type Collection = {
  id: string;
  name: string | Record<string, string>;
  description?: string | Record<string, string> | null;
  status: string;
  isPublic: boolean;
  _count: { collectionSongs: number };
};

const STATUS_ORDER = ["PENDING_REVIEW", "PUBLIC", "PRIVATE"] as const;

export function AdminCollections({
  initialCollections,
  users,
}: {
  initialCollections: Collection[];
  users: Array<{ id: string; displayName: string }>;
}) {
  const t = useTranslations("admin");
  const tf = useTranslations("forms");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [collName, setCollName] = useState<TranslatedStrings>({ fr: "", en: "", duala: "" });
  const [collDesc, setCollDesc] = useState<TranslatedStrings>({ fr: "", en: "", duala: "" });
  const localeLabels: Record<Locale, string> = {
    fr: tf("localeFr"),
    en: tf("localeEn"),
    duala: tf("localeDuala"),
  };
  const langFull: Record<Locale, string> = {
    fr: tf("languageFrench"),
    en: tf("languageEnglish"),
    duala: tf("languageDuala"),
  };
  const [status, setStatus] = useState<"PRIVATE" | "PUBLIC" | "PENDING_REVIEW">("PENDING_REVIEW");
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const btnPrimary =
    "bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-3 py-1.5 text-[12px] font-[var(--font-ui)] hover:bg-[var(--color-deep)] transition-colors cursor-pointer border-none";
  const btnDanger =
    "bg-transparent border-[0.5px] border-[var(--color-amber)] text-[var(--color-amber)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-amber-light)] cursor-pointer";
  const btnSecondary =
    "bg-[var(--color-sand)] text-[var(--color-text-body)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-stone)] cursor-pointer border-none";

  const grouped = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = initialCollections.filter((c) => c.status === status);
      return acc;
    },
    {} as Record<string, Collection[]>,
  );

  async function handleReview(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/collections/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function setCollectionStatus(id: string, next: "PUBLIC" | "PRIVATE") {
    setStatusBusyId(id);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !collName.fr.trim()) return;
    setCreating(true);
    try {
      const base = collName.fr;
      const namePayload = {
        fr: collName.fr,
        en: collName.en.trim() || base,
        duala: collName.duala.trim() || base,
      };
      const hasDesc =
        collDesc.fr.trim() || collDesc.en.trim() || collDesc.duala.trim();
      const descPayload = hasDesc
        ? {
            fr: collDesc.fr,
            en: collDesc.en.trim() || collDesc.fr,
            duala: collDesc.duala.trim() || collDesc.fr,
          }
        : undefined;
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: namePayload,
          description: descPayload,
          status,
        }),
      });
      if (res.ok) {
        setCollName({ fr: "", en: "", duala: "" });
        setCollDesc({ fr: "", en: "", duala: "" });
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      PENDING_REVIEW: {
        bg: "bg-[var(--color-amber-light)]",
        text: "text-[var(--color-amber)]",
        label: t("pending"),
      },
      PUBLIC: {
        bg: "bg-[var(--color-green-light)]",
        text: "text-[var(--color-forest)]",
        label: t("public"),
      },
      PRIVATE: {
        bg: "bg-[var(--color-sand)]",
        text: "text-[var(--color-text-muted)]",
        label: t("private"),
      },
    };
    const s = map[status] ?? map.PRIVATE;
    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium font-[var(--font-ui)] ${s.bg} ${s.text}`}
      >
        {s.label}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("collections")}
      </h1>

      <AdminCollectionsListToolbar />

      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="text-[13px] font-[var(--font-ui)] text-[var(--color-forest)] bg-transparent border-none cursor-pointer underline-offset-2 hover:underline p-0"
        >
          {showCreate ? t("hideCreateForm") : t("showCreateForm")}
        </button>
      </div>

      {showCreate && (
      <form
        onSubmit={handleCreate}
        className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4 mb-8"
      >
        <h2 className="text-[14px] text-[var(--color-deep)] font-[var(--font-display)] mb-3 m-0">
          {t("createCollectionAdmin")}
        </h2>
        <div className="mb-3">
          <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)] block mb-1">
            {t("assignUser")}
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full max-w-md bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px]"
            required
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </div>
        <TranslatedTextField
          id="ac-name"
          label={tf("collectionName")}
          value={collName}
          onChange={setCollName}
          placeholderForLocale={(loc) =>
            tf("placeholderInLanguage", { language: langFull[loc] })
          }
          localeLabels={localeLabels}
          pickerLabel={tf("pickerLabel")}
          editingHint={(loc) => tf("editingLanguage", { language: langFull[loc] })}
          className="mb-1"
        />
        <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0 mb-3">
          {tf("frenchRequiredNote")}
        </p>
        <TranslatedTextField
          id="ac-desc"
          label={tf("collectionDescription")}
          value={collDesc}
          onChange={setCollDesc}
          multiline
          rows={3}
          placeholderForLocale={(loc) =>
            tf("placeholderInLanguage", { language: langFull[loc] })
          }
          localeLabels={localeLabels}
          pickerLabel={tf("pickerLabel")}
          editingHint={(loc) => tf("editingLanguage", { language: langFull[loc] })}
          className="mb-3"
        />
        <div className="mb-3">
          <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)] block mb-1">
            {t("collectionStatus")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full max-w-md bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-2 py-1.5 text-[12px]"
          >
            <option value="PENDING_REVIEW">{t("pending")}</option>
            <option value="PUBLIC">{t("public")}</option>
            <option value="PRIVATE">{t("private")}</option>
          </select>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? <Spinner className="mr-2" /> : null}
          {t("createCollectionAdmin")}
        </Button>
      </form>
      )}

      {initialCollections.length === 0 && (
        <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
          {t("noCollections")}
        </p>
      )}

      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (!items?.length) return null;

        const statusLabel =
          status === "PENDING_REVIEW" ? t("pending") : status === "PUBLIC" ? t("public") : t("private");

        return (
          <div key={status} className="mb-8">
            <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)] mb-3">
              {statusLabel}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((col) => (
                <div
                  key={col.id}
                  className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)]">
                      {getTranslatedName(col.name, locale)}
                    </h4>
                    {statusBadge(col.status)}
                  </div>
                  {col.description && (
                    <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-2">
                      {getTranslatedName(col.description, locale)}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] mb-3">
                    {col._count.collectionSongs} {t("tableSongs").toLowerCase()}
                  </p>
                  {col.status !== "PENDING_REVIEW" && (
                    <label className="flex items-center gap-2 text-[12px] font-[var(--font-ui)] text-[var(--color-text-body)] mb-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="accent-[var(--color-forest)]"
                        checked={col.status === "PUBLIC"}
                        disabled={statusBusyId === col.id}
                        onChange={(e) =>
                          setCollectionStatus(col.id, e.target.checked ? "PUBLIC" : "PRIVATE")
                        }
                      />
                      <span>{t("visiblePublicListing")}</span>
                      {statusBusyId === col.id ? <Spinner className="ml-1" /> : null}
                    </label>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {status === "PENDING_REVIEW" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(col.id, "approve")}
                          className={btnPrimary}
                        >
                          {t("approve")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(col.id, "reject")}
                          className={btnSecondary}
                        >
                          {t("reject")}
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => handleDelete(col.id)} className={btnDanger}>
                      {tc("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
