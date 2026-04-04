"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminAuthorsListToolbar } from "@/components/admin/admin-list-toolbar";

type Author = {
  id: string;
  name: string;
  bio?: string | null;
};

export function AdminAuthors({ initialAuthors }: { initialAuthors: Author[] }) {
  const t = useTranslations("admin");
  const tco = useTranslations("common");
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });

  const [createForm, setCreateForm] = useState({ name: "", bio: "" });
  const [creating, setCreating] = useState(false);

  const inputCls =
    "bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-[var(--font-ui)] text-[var(--color-text-body)] focus:border-[var(--color-forest)] focus:outline-none";
  const btnPrimary =
    "bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-3 py-1.5 text-[12px] font-[var(--font-ui)] hover:bg-[var(--color-deep)] transition-colors cursor-pointer border-none";
  const btnDanger =
    "bg-transparent border-[0.5px] border-[var(--color-amber)] text-[var(--color-amber)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-amber-light)] cursor-pointer";
  const btnSecondary =
    "bg-[var(--color-sand)] text-[var(--color-text-body)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-stone)] cursor-pointer border-none";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          bio: createForm.bio || undefined,
        }),
      });
      setCreateForm({ name: "", bio: "" });
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(id: string) {
    await fetch(`/api/admin/authors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        bio: editForm.bio || undefined,
      }),
    });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/admin/authors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEditing(author: Author) {
    setEditingId(author.id);
    setEditForm({ name: author.name, bio: author.bio ?? "" });
  }

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("authors")}
      </h1>

      <AdminAuthorsListToolbar />

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
          {t("createAuthor")}
        </h2>
        <div className="flex flex-col gap-3 mb-3">
          <input
            className={inputCls}
            placeholder={t("authorName")}
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <textarea
            className={`${inputCls} resize-y min-h-[60px]`}
            placeholder={t("authorBio")}
            value={createForm.bio}
            onChange={(e) => setCreateForm((f) => ({ ...f, bio: e.target.value }))}
            rows={2}
          />
        </div>
        <button type="submit" disabled={creating} className={btnPrimary}>
          {t("createAuthor")}
        </button>
      </form>
      )}

      {initialAuthors.length === 0 && (
        <p className="text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("noAuthors")}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {initialAuthors.map((author) =>
          editingId === author.id ? (
            <div
              key={author.id}
              className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4"
            >
              <div className="flex flex-col gap-2 mb-3">
                <input
                  className={inputCls}
                  placeholder={t("authorName")}
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <textarea
                  className={`${inputCls} resize-y min-h-[60px]`}
                  placeholder={t("authorBio")}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(author.id)} className={btnPrimary}>
                  {t("saveChanges")}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={btnSecondary}>
                  {tco("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div
              key={author.id}
              className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4"
            >
              <h3 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-1">
                {author.name}
              </h3>
              {author.bio && (
                <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-3">
                  {author.bio}
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => startEditing(author)} className={btnSecondary}>
                  {t("editAuthor")}
                </button>
                <button type="button" onClick={() => handleDelete(author.id)} className={btnDanger}>
                  {t("deleteAuthor")}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
