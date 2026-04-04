"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { Button } from "@/components/ui/button";
import { TranslatedTextField, type TranslatedStrings } from "@/components/ui/translated-text-field";
import { Spinner } from "@/components/ui/spinner";
import { ListPendingOverlay } from "@/components/ui/list-pending-overlay";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { Trash2, Plus, Search } from "lucide-react";

type SongEntry = { id: string; title: string; index: number };

type CollectionRow = {
  id: string;
  name: string | Record<string, string>;
  description?: string | Record<string, string> | null;
  status: string;
  isPublic: boolean;
  songs: SongEntry[];
};

export function DashboardCollections({
  initialCollections,
}: {
  initialCollections: CollectionRow[];
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const router = useRouter();
  const [isListPending, startListTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [collName, setCollName] = useState<TranslatedStrings>({ fr: "", en: "", duala: "" });
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
  type Pending =
    | null
    | { k: "delete"; id: string }
    | { k: "add"; collectionId: string; songId: string }
    | { k: "remove"; collectionId: string; songId: string };
  const [pending, setPending] = useState<Pending>(null);
  const [searchColId, setSearchColId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<SongEntry[]>([]);
  const [searching, setSearching] = useState(false);

  function refresh() {
    startListTransition(() => {
      router.refresh();
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!collName.fr.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: {
            fr: collName.fr,
            en: collName.en.trim() || collName.fr,
            duala: collName.duala.trim() || collName.fr,
          },
        }),
      });
      if (res.ok) {
        setCollName({ fr: "", en: "", duala: "" });
        refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(tc("confirm"))) return;
    setPending({ k: "delete", id });
    try {
      await fetch(`/api/dashboard/collections/${id}`, { method: "DELETE" });
      refresh();
    } finally {
      setPending(null);
    }
  }

  async function runSearch() {
    setSearching(true);
    try {
      const res = await fetch(
        `/api/dashboard/songs-search?q=${encodeURIComponent(searchQ)}`,
      );
      const data = await res.json();
      setSearchHits(data.songs ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function addSong(collectionId: string, songId: string) {
    setPending({ k: "add", collectionId, songId });
    try {
      const res = await fetch(`/api/dashboard/collections/${collectionId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (res.ok) {
        refresh();
        setSearchColId(null);
        setSearchHits([]);
        setSearchQ("");
      }
    } finally {
      setPending(null);
    }
  }

  async function removeSong(collectionId: string, songId: string) {
    setPending({ k: "remove", collectionId, songId });
    try {
      await fetch(
        `/api/dashboard/collections/${collectionId}/songs?songId=${encodeURIComponent(songId)}`,
        { method: "DELETE" },
      );
      refresh();
    } finally {
      setPending(null);
    }
  }

  const colBusy =
    pending && (pending.k === "add" || pending.k === "remove") ? pending.collectionId : null;

  function statusBadgeLabel(status: string) {
    if (status === "PUBLIC") return t("collectionStatusPublic");
    if (status === "PENDING_REVIEW") return t("collectionStatusPending");
    return t("collectionStatusPrivate");
  }

  function statusBadgeClass(status: string) {
    if (status === "PUBLIC")
      return "bg-[var(--color-green-light)] text-[var(--color-forest)]";
    if (status === "PENDING_REVIEW")
      return "bg-[var(--color-amber-light)] text-[var(--color-amber)]";
    return "bg-[var(--color-sand)] text-[var(--color-text-muted)]";
  }

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="text-[13px] font-[var(--font-ui)] text-[var(--color-forest)] bg-transparent border-none cursor-pointer underline-offset-2 hover:underline p-0"
        >
          {showCreate ? t("hideCreateSection") : t("showCreateSection")}
        </button>
      </div>

      {showCreate && (
      <form
        onSubmit={handleCreate}
        className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4 mb-6"
      >
        <h3 className="text-[14px] text-[var(--color-deep)] font-[var(--font-display)] mb-3 m-0">
          {t("newCollection")}
        </h3>
        <TranslatedTextField
          id="cname"
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
        <Button type="submit" disabled={creating}>
          {creating ? <Spinner className="mr-2" /> : null}
          {t("createCollection")}
        </Button>
      </form>
      )}

      <ListPendingOverlay pending={isListPending} namespace="common" className="min-h-[120px]">
        <div className="space-y-4">
        {initialCollections.map((col) => (
          <div
            key={col.id}
            className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] m-0">
                  {getTranslatedName(col.name, locale)}
                </h4>
                {col.description && (
                  <p className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)] m-0 mt-1">
                    {getTranslatedName(col.description, locale)}
                  </p>
                )}
                <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0 mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium font-[var(--font-ui)] ${statusBadgeClass(col.status)}`}
                  >
                    {statusBadgeLabel(col.status)}
                  </span>
                  <span>
                    {col.songs.length} {tc("songs")}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(col.id)}
                disabled={pending?.k === "delete" && pending.id === col.id}
                className="p-1.5 text-[var(--color-amber)] bg-transparent border-none cursor-pointer hover:bg-[var(--color-amber-light)] rounded-[var(--radius-sm)] disabled:opacity-50"
                aria-label={tc("delete")}
              >
                {pending?.k === "delete" && pending.id === col.id ? <Spinner /> : <Trash2 size={16} />}
              </button>
            </div>
            <ul className="list-none m-0 p-0 space-y-1 mb-3">
              {col.songs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-[13px] font-[var(--font-ui)] text-[var(--color-text-body)]"
                >
                  <Link href={`/songs/${s.id}`} className="no-underline hover:underline text-[var(--color-forest)]">
                    {String(s.index).padStart(2, "0")} · {s.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSong(col.id, s.id)}
                    disabled={
                      pending?.k === "remove" &&
                      pending.collectionId === col.id &&
                      pending.songId === s.id
                    }
                    className="min-w-[4rem] text-[11px] text-[var(--color-text-muted)] bg-transparent border-none cursor-pointer hover:text-[var(--color-amber)] inline-flex items-center justify-end gap-1 disabled:opacity-60"
                  >
                    {pending?.k === "remove" &&
                    pending.collectionId === col.id &&
                    pending.songId === s.id ? (
                      <Spinner />
                    ) : (
                      tc("remove")
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {searchColId === col.id ? (
              <div className="border-t-[0.5px] border-t-[var(--color-stone)] pt-3 mt-2">
                <div className="flex gap-2 mb-2">
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
                    placeholder={t("searchSongsToAdd")}
                    className="flex-1 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-[var(--font-ui)]"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={runSearch} disabled={searching}>
                    {searching ? <Spinner /> : <Search size={14} />}
                  </Button>
                </div>
                <ul className="space-y-1 m-0 p-0 list-none">
                  {searchHits.map((s) => (
                    <li key={s.id} className="flex justify-between items-center text-[12px]">
                      <span>
                        {String(s.index).padStart(2, "0")} · {s.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => addSong(col.id, s.id)}
                        disabled={
                          col.songs.some((x) => x.id === s.id) ||
                          (pending?.k === "add" &&
                            pending.collectionId === col.id &&
                            pending.songId === s.id)
                        }
                        className="text-[var(--color-forest)] bg-transparent border-none cursor-pointer flex items-center gap-1 min-w-[3.5rem] justify-end disabled:opacity-60"
                      >
                        {pending?.k === "add" &&
                        pending.collectionId === col.id &&
                        pending.songId === s.id ? (
                          <Spinner />
                        ) : (
                          <>
                            <Plus size={14} /> {tc("add")}
                          </>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSearchColId(null)}
                  className="mt-2 text-[12px] text-[var(--color-text-muted)] bg-transparent border-none cursor-pointer"
                >
                  {tc("close")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchColId(col.id);
                  setSearchQ("");
                  setSearchHits([]);
                }}
                disabled={colBusy === col.id}
                className="text-[12px] text-[var(--color-forest)] font-[var(--font-ui)] bg-transparent border-none cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {colBusy === col.id ? <Spinner className="mr-1" /> : <Plus size={14} />}{" "}
                {t("addSongs")}
              </button>
            )}
          </div>
        ))}
        </div>
      </ListPendingOverlay>
    </div>
  );
}
