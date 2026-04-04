"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { TranslatedTextField, type TranslatedStrings } from "@/components/ui/translated-text-field";
import type { Locale } from "@/i18n/config";
import { AdminTagsListToolbar } from "@/components/admin/admin-list-toolbar";

type Tag = {
  id: string;
  key?: string | null;
  name: string | Record<string, string>;
  category?: string | null;
};

const CATEGORIES = ["MOOD", "THEME", "STYLE", "ERA"] as const;

export function AdminTags({ initialTags }: { initialTags: Tag[] }) {
  const t = useTranslations("admin");
  const tc = useTranslations("tagCategory");
  const tf = useTranslations("forms");
  const tco = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    key: string;
    name: TranslatedStrings;
    category: string;
  }>({ key: "", name: { fr: "", en: "", duala: "" }, category: "MOOD" });

  const [createForm, setCreateForm] = useState({
    key: "",
    name: { fr: "", en: "", duala: "" } as TranslatedStrings,
    category: "MOOD",
  });
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const grouped = initialTags.reduce(
    (acc, tag) => {
      const cat = tag.category || "OTHER";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tag);
      return acc;
    },
    {} as Record<string, Tag[]>,
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.fr.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: createForm.key || undefined,
          name: {
            fr: createForm.name.fr,
            en: createForm.name.en,
            duala: createForm.name.duala,
          },
          category: createForm.category,
        }),
      });
      setCreateForm({ key: "", name: { fr: "", en: "", duala: "" }, category: "MOOD" });
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editForm.name.fr.trim()) return;
    await fetch(`/api/admin/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: editForm.key || undefined,
        name: {
          fr: editForm.name.fr,
          en: editForm.name.en,
          duala: editForm.name.duala,
        },
        category: editForm.category,
      }),
    });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEditing(tag: Tag) {
    const name = typeof tag.name === "string" ? { fr: tag.name, en: "", duala: "" } : tag.name;
    setEditingId(tag.id);
    setEditForm({
      key: tag.key ?? "",
      name: {
        fr: name.fr ?? "",
        en: name.en ?? "",
        duala: name.duala ?? "",
      },
      category: tag.category ?? "MOOD",
    });
  }

  const inputCls =
    "bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-[var(--font-ui)] text-[var(--color-text-body)] focus:border-[var(--color-forest)] focus:outline-none";
  const btnPrimary =
    "bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-3 py-1.5 text-[12px] font-[var(--font-ui)] hover:bg-[var(--color-deep)] transition-colors cursor-pointer border-none";
  const btnDanger =
    "bg-transparent border-[0.5px] border-[var(--color-amber)] text-[var(--color-amber)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-amber-light)] cursor-pointer";
  const btnSecondary =
    "bg-[var(--color-sand)] text-[var(--color-text-body)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-stone)] cursor-pointer border-none";

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("tags")}
      </h1>

      <AdminTagsListToolbar />

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
      <form onSubmit={handleCreate} className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4 mb-8">
        <h2 className="text-[14px] text-[var(--color-deep)] font-[var(--font-display)] mb-3">
          {t("createTag")}
        </h2>
        <div className="flex flex-col gap-3 mb-3">
          <input
            className={inputCls}
            placeholder={t("tagKey")}
            value={createForm.key}
            onChange={(e) => setCreateForm((f) => ({ ...f, key: e.target.value }))}
          />
          <TranslatedTextField
            id="create-tag-name"
            label={tf("tagDisplayName")}
            value={createForm.name}
            onChange={(name) => setCreateForm((f) => ({ ...f, name }))}
            placeholderForLocale={(loc) =>
              tf("placeholderInLanguage", { language: langFull[loc] })
            }
            localeLabels={localeLabels}
            pickerLabel={tf("pickerLabel")}
            editingHint={(loc) => tf("editingLanguage", { language: langFull[loc] })}
          />
          <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0 -mt-2 mb-1">
            {tf("frenchRequiredNote")}
          </p>
          <select
            className={inputCls}
            value={createForm.category}
            onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {tc(cat)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={creating} className={btnPrimary}>
          {t("createTag")}
        </button>
      </form>
      )}

      {Object.keys(grouped).length === 0 && (
        <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("noTags")}</p>
      )}

      {CATEGORIES.map((category) => {
        const categoryTags = grouped[category];
        if (!categoryTags?.length) return null;
        return (
          <div key={category} className="mb-6">
            <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)] mb-2">
              {tc(category)}
            </h3>
            <div className="flex flex-col gap-2">
              {categoryTags.map((tag) =>
                editingId === tag.id ? (
                  <div
                    key={tag.id}
                    className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-3"
                  >
                    <div className="flex flex-col gap-2 mb-2">
                      <input
                        className={inputCls}
                        placeholder={t("tagKey")}
                        value={editForm.key}
                        onChange={(e) => setEditForm((f) => ({ ...f, key: e.target.value }))}
                      />
                      <TranslatedTextField
                        id={`edit-tag-name-${tag.id}`}
                        label={tf("tagDisplayName")}
                        value={editForm.name}
                        onChange={(name) => setEditForm((f) => ({ ...f, name }))}
                        placeholderForLocale={(loc) =>
                          tf("placeholderInLanguage", { language: langFull[loc] })
                        }
                        localeLabels={localeLabels}
                        pickerLabel={tf("pickerLabel")}
                        editingHint={(loc) => tf("editingLanguage", { language: langFull[loc] })}
                      />
                      <select
                        className={inputCls}
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {tc(cat)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(tag.id)} className={btnPrimary}>
                        {t("saveChanges")}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className={btnSecondary}>
                        {tco("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2"
                  >
                    <span className="text-[14px] text-[var(--color-text-body)] font-[var(--font-ui)] flex-1">
                      {getTranslatedName(tag.name, locale)}
                      {tag.key && (
                        <span className="text-[11px] text-[var(--color-text-muted)] ml-1">({tag.key})</span>
                      )}
                    </span>
                    <button type="button" onClick={() => startEditing(tag)} className={btnSecondary}>
                      {t("editTag")}
                    </button>
                    <button type="button" onClick={() => handleDelete(tag.id)} className={btnDanger}>
                      {t("deleteTag")}
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
