"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { Spinner } from "@/components/ui/spinner";
import { BackLink } from "@/components/ui/back-link";
import type { SongWithRelations } from "@/lib/data-provider";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { uploadSongPreviewFile } from "@/lib/song-preview-upload";
type TagRow = { id: string; key: string; name: unknown; category: string };
type LangRow = { id: string; code: string; name: unknown };

export function SongEditForm({
  song,
  allAuthors,
  allTags,
  allLanguages,
}: {
  song: SongWithRelations;
  allAuthors: Array<{ id: string; name: string }>;
  allTags: TagRow[];
  allLanguages: LangRow[];
}) {
  const t = useTranslations("admin");
  const tsong = useTranslations("song");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const locale = useLocale();
  const router = useRouter();
  const [isRefreshPending, startRefreshTransition] = useTransition();

  const [title, setTitle] = useState(song.title);
  const [status, setStatus] = useState(song.status);
  const [lyrics, setLyrics] = useState(song.versions[0]?.lyrics ?? "");
  const [authorIds, setAuthorIds] = useState(song.authors.map((a) => a.id));
  const [tagIds, setTagIds] = useState(song.tags.map((x) => x.id));
  const [languageIds, setLanguageIds] = useState(song.languages.map((l) => l.id));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [newVersionType, setNewVersionType] = useState<"ORIGINAL" | "DEMO" | "REWRITE">("DEMO");
  const [newVersionLyrics, setNewVersionLyrics] = useState("");

  const [annVersionId, setAnnVersionId] = useState(song.versions[0]?.id ?? "");
  const [annLine, setAnnLine] = useState(1);
  const [annLineText, setAnnLineText] = useState("");
  const [annNote, setAnnNote] = useState("");

  const [prevVersionId, setPrevVersionId] = useState(song.versions[0]?.id ?? "");
  const [prevUrl, setPrevUrl] = useState("");
  const [prevDur, setPrevDur] = useState(0);

  const [newNote, setNewNote] = useState("");
  const previewFileRef = useRef<HTMLInputElement>(null);

  type EditTab = "basic" | "relations" | "versions" | "annotations" | "previews" | "notes";
  const [editTab, setEditTab] = useState<EditTab>("basic");

  const refresh = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<string[]>>) => {
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveCore = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          lyrics,
          authorIds,
          tagIds,
          languageIds,
        }),
      });
      if (res.ok) refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveCore();
    router.push("/admin/songs");
  };

  const addVersion = async () => {
    setBusy("version");
    try {
      await fetch(`/api/admin/songs/${song.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionType: newVersionType,
          lyrics: newVersionLyrics,
        }),
      });
      setNewVersionLyrics("");
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const saveVersionLyrics = async (versionId: string, text: string) => {
    setBusy(versionId);
    try {
      await fetch(`/api/admin/songs/${song.id}/versions/${versionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: text }),
      });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (!confirm(tc("confirm"))) return;
    setBusy(versionId);
    try {
      await fetch(`/api/admin/songs/${song.id}/versions/${versionId}`, {
        method: "DELETE",
      });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const addAnnotation = async () => {
    if (!annVersionId || !annLineText || !annNote) return;
    setBusy("ann");
    try {
      await fetch(`/api/admin/songs/${song.id}/versions/${annVersionId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineNumber: annLine,
          lineText: annLineText,
          note: annNote,
        }),
      });
      setAnnLineText("");
      setAnnNote("");
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteAnnotation = async (versionId: string, annotationId: string) => {
    setBusy(annotationId);
    try {
      await fetch(
        `/api/admin/songs/${song.id}/versions/${versionId}/annotations/${annotationId}`,
        { method: "DELETE" },
      );
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const addPreview = async () => {
    if (!prevUrl.trim()) return;
    setBusy("prev");
    try {
      await fetch(`/api/admin/songs/${song.id}/versions/${prevVersionId}/previews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: prevUrl, durationSeconds: prevDur }),
      });
      setPrevUrl("");
      setPrevDur(0);
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const deletePreview = async (versionId: string, previewId: string) => {
    setBusy(previewId);
    try {
      await fetch(
        `/api/admin/songs/${song.id}/versions/${versionId}/previews/${previewId}`,
        { method: "DELETE" },
      );
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setBusy("note");
    try {
      await fetch(`/api/admin/songs/${song.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote("");
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    setBusy(noteId);
    try {
      await fetch(`/api/admin/songs/${song.id}/notes/${noteId}`, { method: "DELETE" });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const uploadPreviewFromFile = async () => {
    const file = previewFileRef.current?.files?.[0];
    if (!file || !prevVersionId) return;
    setBusy("prev-file");
    try {
      const { publicUrl, durationSeconds } = await uploadSongPreviewFile(file, song.id, prevVersionId);
      const res = await fetch(`/api/admin/songs/${song.id}/versions/${prevVersionId}/previews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: publicUrl, durationSeconds }),
      });
      if (res.ok) {
        if (previewFileRef.current) previewFileRef.current.value = "";
        refresh();
      }
    } catch (err) {
      console.error(err);
      window.alert(t("uploadFailed"));
    } finally {
      setBusy(null);
    }
  };

  const tabDefs: { id: EditTab; label: string }[] = [
    { id: "basic", label: t("tabBasic") },
    { id: "relations", label: t("tabRelations") },
    { id: "versions", label: t("tabVersions") },
    { id: "annotations", label: t("tabAnnotations") },
    { id: "previews", label: t("tabPreviews") },
    { id: "notes", label: t("tabNotes") },
  ];

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <BackLink href="/admin/songs" label={tc("back")} />

      {isRefreshPending && (
        <div
          className="sticky top-0 z-20 flex items-center gap-2 py-2 px-3 -mx-1 border-b-[0.5px] border-b-[var(--color-stone)] bg-[var(--color-parchment)] text-[13px] text-[var(--color-text-body)] font-[var(--font-ui)]"
          role="status"
          aria-live="polite"
        >
          <Spinner />
          {tc("updating")}
        </div>
      )}

      <div
        className="flex gap-1 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1"
        role="tablist"
        aria-label="Song editor sections"
      >
        {tabDefs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={editTab === id}
            onClick={() => setEditTab(id)}
            className={`snap-start shrink-0 px-3 py-2 rounded-[var(--radius-md)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer transition-colors whitespace-nowrap ${
              editTab === id
                ? "bg-[var(--color-forest)] text-[var(--color-parchment)] border-[var(--color-forest)]"
                : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)] hover:bg-[var(--color-sand)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col gap-5 ${editTab !== "basic" && editTab !== "relations" ? "hidden" : ""}`}
      >
        <div className={editTab !== "basic" ? "hidden" : "flex flex-col gap-5"}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="title"
              label={t("tableTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              id="index"
              label={t("hymnNumber")}
              type="number"
              value={String(song.index)}
              disabled
            />
          </div>

          <div>
            <SectionLabel>{t("tableStatus")}</SectionLabel>
            <div className="flex gap-2">
              {(["DRAFT", "FINISHED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer ${
                    status === s
                      ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]"
                      : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)]"
                  }`}
                >
                  {ts(s.toLowerCase() as "draft" | "finished")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>{t("songs")}</SectionLabel>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={12}
              className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[15px] text-[var(--color-deep)] font-[var(--font-display)] outline-none resize-y focus:border-[var(--color-forest)] focus:bg-[var(--color-parchment)]"
              required
            />
          </div>
        </div>

        <div className={editTab !== "relations" ? "hidden" : "flex flex-col gap-5"}>
          <div>
            <SectionLabel>{t("tableAuthor")}</SectionLabel>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {allAuthors.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-[13px] font-[var(--font-ui)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorIds.includes(a.id)}
                    onChange={() => toggle(a.id, setAuthorIds)}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>{t("tags")}</SectionLabel>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {allTags.map((tg) => (
                <label key={tg.id} className="flex items-center gap-2 text-[13px] font-[var(--font-ui)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tg.id)}
                    onChange={() => toggle(tg.id, setTagIds)}
                  />
                  {getTranslatedName(tg.name as Record<string, string>, locale)} ({tg.key})
                </label>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>{t("languagesSection")}</SectionLabel>
            <div className="flex flex-wrap gap-3">
              {allLanguages.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-[13px] font-[var(--font-ui)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={languageIds.includes(l.id)}
                    onChange={() => toggle(l.id, setLanguageIds)}
                  />
                  {getTranslatedName(l.name as Record<string, string>, locale)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {(editTab === "basic" || editTab === "relations") && (
          <div className="flex gap-2 flex-wrap pt-1">
            <Button type="button" onClick={handleSaveCore} disabled={saving}>
              {saving ? <Spinner className="mr-1" /> : null}
              {t("saveChanges")}
            </Button>
            <Button type="submit" disabled={saving}>
              {t("saveChanges")} · {tc("back")}
            </Button>
            <Button variant="secondary" type="button" onClick={() => router.back()}>
              {tc("cancel")}
            </Button>
          </div>
        )}
      </form>

      <div className={editTab !== "versions" ? "hidden" : "flex flex-col gap-4"}>
        <h2 className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)] m-0">
          {tsong("versions")}
        </h2>
        {song.versions.map((v) => (
          <div
            key={v.id}
            className="mb-6 bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] font-[var(--font-ui)] text-[var(--color-text-body)]">
                v{v.versionNumber} · {v.versionType}
              </span>
              <button
                type="button"
                onClick={() => deleteVersion(v.id)}
                disabled={busy === v.id || song.versions.length <= 1}
                className="text-[11px] text-[var(--color-amber)] bg-transparent border-none cursor-pointer disabled:opacity-40"
              >
                {tc("delete")}
              </button>
            </div>
            <textarea
              defaultValue={v.lyrics}
              rows={8}
              className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[14px] font-[var(--font-display)] mb-2"
              onBlur={(e) => {
                if (e.target.value !== v.lyrics) saveVersionLyrics(v.id, e.target.value);
              }}
            />
            <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)] m-0">
              {t("versionStats", {
                annotationCount: v.annotations.length,
                previewCount: v.previews.length,
              })}
            </p>
          </div>
        ))}

        <SectionLabel>{t("addVersionBlock")}</SectionLabel>
        <div className="flex flex-wrap gap-2 items-end mb-2">
          <select
            value={newVersionType}
            onChange={(e) => setNewVersionType(e.target.value as typeof newVersionType)}
            className="bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px]"
          >
            <option value="ORIGINAL">{t("versionTypeOriginal")}</option>
            <option value="DEMO">{t("versionTypeDemo")}</option>
            <option value="REWRITE">{t("versionTypeRewrite")}</option>
          </select>
          <Button type="button" size="sm" onClick={addVersion} disabled={busy === "version"}>
            {busy === "version" ? <Spinner /> : null}
            {t("createSong")}
          </Button>
        </div>
        <textarea
          value={newVersionLyrics}
          onChange={(e) => setNewVersionLyrics(e.target.value)}
          rows={4}
          placeholder={t("lyricsPlaceholder")}
          className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px]"
        />
      </div>

      <div className={editTab !== "annotations" ? "hidden" : "flex flex-col gap-3"}>
        <h2 className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)] m-0 mb-1">
          {t("tabAnnotations")}
        </h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <select
            value={annVersionId}
            onChange={(e) => setAnnVersionId(e.target.value)}
            className="bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-2 py-1.5 text-[12px]"
          >
            {song.versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
          <Input
            id="ln"
            label={t("lineNumberLabel")}
            type="number"
            min={1}
            value={String(annLine)}
            onChange={(e) => setAnnLine(Number(e.target.value) || 1)}
            className="max-w-[100px]"
          />
        </div>
        <Input
          id="lt"
          label={t("lineTextLabel")}
          value={annLineText}
          onChange={(e) => setAnnLineText(e.target.value)}
        />
        <Input
          id="nt"
          label={t("annotationNoteLabel")}
          value={annNote}
          onChange={(e) => setAnnNote(e.target.value)}
        />
        <Button type="button" className="mt-2" size="sm" onClick={addAnnotation} disabled={busy === "ann"}>
          {busy === "ann" ? <Spinner /> : null}
          {t("saveChanges")}
        </Button>
        <ul className="mt-4 space-y-2 list-none p-0 m-0">
          {song.versions.flatMap((v) =>
            v.annotations.map((a) => (
              <li
                key={a.id}
                className="flex justify-between gap-2 text-[12px] font-[var(--font-ui)] bg-[var(--color-linen)] rounded-[var(--radius-sm)] px-2 py-1"
              >
                <span>
                  v{v.versionNumber} L{a.lineNumber}: {a.note.slice(0, 80)}
                  {a.note.length > 80 ? "…" : ""}
                </span>
                <button
                  type="button"
                  className="text-[var(--color-amber)] bg-transparent border-none cursor-pointer"
                  onClick={() => deleteAnnotation(v.id, a.id)}
                >
                  {tc("delete")}
                </button>
              </li>
            )),
          )}
        </ul>
      </div>

      <div className={editTab !== "previews" ? "hidden" : "flex flex-col gap-3"}>
        <h2 className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)] m-0 mb-1">
          {t("tabPreviews")}
        </h2>
        <select
          value={prevVersionId}
          onChange={(e) => setPrevVersionId(e.target.value)}
          className="mb-2 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-2 py-1.5 text-[12px]"
        >
          {song.versions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versionNumber}
            </option>
          ))}
        </select>
        <SectionLabel>{t("chooseAudioFile")}</SectionLabel>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            ref={previewFileRef}
            type="file"
            accept="audio/*"
            className="text-[12px] font-[var(--font-ui)] text-[var(--color-text-body)] max-w-[min(100%,320px)] file:mr-2 file:text-[12px]"
          />
          <Button
            type="button"
            size="sm"
            onClick={uploadPreviewFromFile}
            disabled={busy === "prev-file"}
          >
            {busy === "prev-file" ? <Spinner /> : null}
            {t("uploadAudio")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input
            id="purl"
            label={t("audioUrlLabel")}
            value={prevUrl}
            onChange={(e) => setPrevUrl(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Input
            id="pdur"
            label={t("durationSecondsLabel")}
            type="number"
            min={0}
            value={String(prevDur)}
            onChange={(e) => setPrevDur(Number(e.target.value) || 0)}
            className="max-w-[120px]"
          />
          <Button type="button" size="sm" onClick={addPreview} disabled={busy === "prev"}>
            {busy === "prev" ? <Spinner /> : null}
            {t("addSong")}
          </Button>
        </div>
        <ul className="mt-3 space-y-2 list-none p-0 m-0">
          {song.versions.flatMap((v) =>
            v.previews.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center gap-2 text-[12px] font-[var(--font-ui)]"
              >
                <a href={p.fileUrl} target="_blank" rel="noreferrer" className="text-[var(--color-forest)] truncate">
                  {p.fileUrl}
                </a>
                <span className="shrink-0">{p.durationSeconds}s</span>
                <button
                  type="button"
                  className="text-[var(--color-amber)] bg-transparent border-none cursor-pointer"
                  onClick={() => deletePreview(v.id, p.id)}
                >
                  {tc("delete")}
                </button>
              </li>
            )),
          )}
        </ul>
      </div>

      <div className={editTab !== "notes" ? "hidden" : "flex flex-col gap-3"}>
        <h2 className="text-[18px] text-[var(--color-deep)] font-[var(--font-display)] m-0 mb-1">
          {tsong("notes")}
        </h2>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3 py-2 text-[13px] mb-2"
          placeholder={t("noteContentPlaceholder")}
        />
        <Button type="button" size="sm" onClick={addNote} disabled={busy === "note"}>
          {busy === "note" ? <Spinner /> : null}
          {t("addNote")}
        </Button>
        <ul className="mt-3 space-y-2 list-none p-0 m-0">
          {song.notes.map((n) => (
            <li
              key={n.id}
              className="flex justify-between gap-2 text-[13px] font-[var(--font-ui)] bg-[var(--color-linen)] rounded-[var(--radius-md)] px-3 py-2"
            >
              <span>{n.content}</span>
              <button
                type="button"
                className="text-[var(--color-amber)] bg-transparent border-none cursor-pointer"
                onClick={() => deleteNote(n.id)}
              >
                {tc("delete")}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
