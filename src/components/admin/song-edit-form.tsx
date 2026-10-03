"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { Spinner } from "@/components/ui/spinner";
import { BackLink } from "@/components/ui/back-link";
import { useAppConfig } from "@/components/providers/app-config";
import { LyricsEditor } from "@/components/admin/lyrics-editor";
import { ReferencesEditor, type HymnalOption, type ReferenceRow } from "@/components/admin/references-editor";
import type { SongWithRelations } from "@/lib/data-provider";
import { getTranslatedName } from "@/lib/i18n-helpers";
import { numberedLines, serializeLyrics } from "@/lib/lyrics";
import { uploadSongPreviewFile } from "@/lib/song-preview-upload";

type TagRow = { id: string; key: string; name: unknown; category: string };
type LangRow = { id: string; code: string; name: unknown };
type EditTab = "text" | "relations" | "versions" | "annotations" | "previews" | "notes";

const fieldCls = "bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 text-[13px] text-deep";

/** Create (song = null) or edit a hymn. */
export function SongEditForm({
  song,
  nextIndex,
  allAuthors,
  allTags,
  allLanguages,
  hymnals,
}: {
  song: SongWithRelations | null;
  nextIndex?: number;
  allAuthors: Array<{ id: string; name: string }>;
  allTags: TagRow[];
  allLanguages: LangRow[];
  hymnals: HymnalOption[];
}) {
  const t = useTranslations("admin");
  const tsong = useTranslations("song");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const locale = useLocale();
  const router = useRouter();
  const config = useAppConfig();
  const [isRefreshPending, startRefresh] = useTransition();
  const creating = !song;
  const latest = song?.versions[0];

  const [title, setTitle] = useState(song?.title ?? "");
  const [index, setIndex] = useState(String(song?.index ?? nextIndex ?? ""));
  const [status, setStatus] = useState(song?.status ?? "DRAFT");
  const [page, setPage] = useState(song?.page ? String(song.page) : "");
  const [tune, setTune] = useState(song?.tune ?? "");
  const [lyricsText, setLyricsText] = useState(latest ? serializeLyrics(latest.content) : "");
  const [refrainAfterEach, setRefrainAfterEach] = useState<boolean | undefined>(latest?.content.refrainAfterEachStanza);
  const [references, setReferences] = useState<ReferenceRow[]>(song?.references.map((r) => ({ hymnalId: r.hymnalId, number: r.number })) ?? []);
  const [authorIds, setAuthorIds] = useState(song?.authors.map((a) => a.id) ?? []);
  const [tagIds, setTagIds] = useState(song?.tags.map((x) => x.id) ?? []);
  const [languageIds, setLanguageIds] = useState(
    song?.languages.map((l) => l.id) ?? allLanguages.filter((l) => l.code === "duala").map((l) => l.id),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<EditTab>("text");

  const [newVersionType, setNewVersionType] = useState<"ORIGINAL" | "DEMO" | "REWRITE">("REWRITE");
  const [annVersionId, setAnnVersionId] = useState(latest?.id ?? "");
  const [annLine, setAnnLine] = useState(1);
  const [annNote, setAnnNote] = useState("");
  const [prevVersionId, setPrevVersionId] = useState(latest?.id ?? "");
  const [prevUrl, setPrevUrl] = useState("");
  const [prevDur, setPrevDur] = useState(0);
  const [newNote, setNewNote] = useState("");
  const previewFileRef = useRef<HTMLInputElement>(null);

  const annLines = useMemo(() => {
    const v = song?.versions.find((x) => x.id === annVersionId);
    return v ? numberedLines(v.content) : [];
  }, [song, annVersionId]);

  const refresh = () => startRefresh(() => router.refresh());
  const toggle = (id: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const api = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error === "INDEX_TAKEN" ? t("indexTaken") : (data.error ?? `HTTP ${res.status}`));
    }
    return res.json().catch(() => ({}));
  };

  const saveCore = async (): Promise<string | null> => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const body = {
        title: title.trim(),
        index: Number(index),
        status,
        page: page ? Number(page) : null,
        tune: tune.trim() || null,
        lyricsText,
        refrainAfterEachStanza: refrainAfterEach,
        authorIds,
        tagIds,
        languageIds,
        references: references.filter((r) => r.number),
      };
      if (creating) {
        const created = (await api("/api/admin/songs", "POST", body)) as { id: string };
        return created.id;
      }
      await api(`/api/admin/songs/${song.id}`, "PUT", body);
      setSaved(true);
      refresh();
      return song.id;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await fn();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const tabs: { id: EditTab; label: string }[] = [
    { id: "text", label: t("tabText") },
    { id: "relations", label: t("tabRelations") },
    ...(creating
      ? []
      : ([
          { id: "versions", label: t("tabVersions") },
          { id: "annotations", label: t("tabAnnotations") },
          { id: "previews", label: t("tabPreviews") },
          { id: "notes", label: t("tabNotes") },
        ] as const)),
  ];

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] border-[0.5px] cursor-pointer ${
      active ? "bg-forest text-parchment border-forest" : "bg-linen text-text-body border-stone"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <BackLink href="/admin/songs" label={tc("back")} />
        {song && (
          <a href={`/songs/${song.index}`} target="_blank" rel="noreferrer" className="text-[12px] text-forest">
            {t("viewPublic")}
          </a>
        )}
      </div>

      {isRefreshPending && (
        <div className="flex items-center gap-2 text-[12px] text-text-muted" role="status">
          <Spinner /> {tc("updating")}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={editTab === id}
            onClick={() => setEditTab(id)}
            className={`shrink-0 px-3 py-2 rounded-[var(--radius-md)] text-[12px] border-[0.5px] cursor-pointer whitespace-nowrap ${
              editTab === id ? "bg-forest text-parchment border-forest" : "bg-linen text-text-body border-stone hover:bg-sand"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="m-0 text-[13px] text-danger bg-danger-light rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </p>
      )}

      {/* Text: number, title, status, page, tune, lyrics */}
      <div className={editTab === "text" ? "flex flex-col gap-5" : "hidden"}>
        <div className="grid grid-cols-2 sm:grid-cols-[110px_1fr_110px] gap-3">
          <Input id="index" label={t("hymnNumber")} type="number" min={1} value={index} onChange={(e) => setIndex(e.target.value)} required />
          <Input id="title" label={t("tableTitle")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} className="col-span-2 sm:col-span-1" />
          <Input id="page" label={t("bookPage")} type="number" min={1} value={page} onChange={(e) => setPage(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <Input id="tune" label={t("tune")} value={tune} onChange={(e) => setTune(e.target.value)} placeholder={t("tunePlaceholder")} />
          <div>
            <SectionLabel>{t("tableStatus")}</SectionLabel>
            <div className="flex gap-2">
              {(["DRAFT", "FINISHED"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>
                  {ts(s.toLowerCase() as "draft" | "finished")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <SectionLabel>{t("lyrics")}</SectionLabel>
          <LyricsEditor
            value={lyricsText}
            onChange={setLyricsText}
            refrainAfterEach={refrainAfterEach}
            onRefrainAfterEachChange={setRefrainAfterEach}
          />
        </div>
      </div>

      {/* References, authors, tags, languages */}
      <div className={editTab === "relations" ? "flex flex-col gap-6" : "hidden"}>
        <div>
          <SectionLabel>{t("references")}</SectionLabel>
          <ReferencesEditor hymnals={hymnals} value={references} onChange={setReferences} />
        </div>
        <div>
          <SectionLabel>{t("tableAuthor")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {allAuthors.map((a) => (
              <button key={a.id} type="button" onClick={() => toggle(a.id, setAuthorIds)} className={chip(authorIds.includes(a.id))}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>{t("tags")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tg) => (
              <button key={tg.id} type="button" onClick={() => toggle(tg.id, setTagIds)} className={chip(tagIds.includes(tg.id))}>
                {getTranslatedName(tg.name as Record<string, string>, locale)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>{t("languagesSection")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {allLanguages.map((l) => (
              <button key={l.id} type="button" onClick={() => toggle(l.id, setLanguageIds)} className={chip(languageIds.includes(l.id))}>
                {getTranslatedName(l.name as Record<string, string>, locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(editTab === "text" || editTab === "relations") && (
        <div className="sticky bottom-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-parchment border-t-[0.5px] border-t-stone flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={saving || !index}
            onClick={async () => {
              const id = await saveCore();
              if (id && creating) router.push(`/admin/songs/${id}/edit`);
            }}
          >
            {saving && <Spinner />} {creating ? t("createSong") : t("saveChanges")}
          </Button>
          {!creating && (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                if (await saveCore()) router.push("/admin/songs");
              }}
            >
              {t("saveChanges")} · {tc("back")}
            </Button>
          )}
          {saved && <span className="text-[12px] text-forest">{t("saved")}</span>}
        </div>
      )}

      {song && (
        <>
          {/* Versions */}
          <div className={editTab === "versions" ? "flex flex-col gap-4" : "hidden"}>
            <p className="text-[12px] text-text-muted m-0">{t("versionsHint")}</p>
            {song.versions.map((v) => (
              <div key={v.id} className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-md)] p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-text-body">
                    v{v.versionNumber} · {tsong(`versionType.${v.versionType}`)}
                    {v.id === latest?.id && <span className="text-text-muted"> · {t("currentVersion")}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => confirm(tc("confirm")) && run(v.id, () => api(`/api/admin/songs/${song.id}/versions/${v.id}`, "DELETE"))}
                    disabled={busy === v.id || song.versions.length <= 1}
                    className="text-[11px] text-danger bg-transparent border-none cursor-pointer disabled:opacity-40"
                  >
                    {tc("delete")}
                  </button>
                </div>
                <textarea
                  defaultValue={serializeLyrics(v.content)}
                  rows={8}
                  className={`w-full ${fieldCls} font-display text-[14px]`}
                  onBlur={(e) => {
                    if (e.target.value !== serializeLyrics(v.content)) {
                      void run(v.id, () => api(`/api/admin/songs/${song.id}/versions/${v.id}`, "PUT", { lyricsText: e.target.value }));
                    }
                  }}
                />
                <p className="text-[11px] text-text-muted m-0 mt-1">
                  {t("versionStats", { annotationCount: v.annotations.length, previewCount: v.previews.length })}
                </p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 items-center">
              <select value={newVersionType} onChange={(e) => setNewVersionType(e.target.value as typeof newVersionType)} className={fieldCls}>
                <option value="ORIGINAL">{t("versionTypeOriginal")}</option>
                <option value="DEMO">{t("versionTypeDemo")}</option>
                <option value="REWRITE">{t("versionTypeRewrite")}</option>
              </select>
              <Button
                type="button"
                size="sm"
                disabled={busy === "version"}
                onClick={() => run("version", () => api(`/api/admin/songs/${song.id}/versions`, "POST", { versionType: newVersionType, lyricsText }))}
              >
                {busy === "version" && <Spinner />} {t("addVersionFromCurrent")}
              </Button>
            </div>
          </div>

          {/* Annotations: pick a line of the chosen version */}
          <div className={editTab === "annotations" ? "flex flex-col gap-3" : "hidden"}>
            <div className="flex flex-wrap gap-2">
              <select value={annVersionId} onChange={(e) => setAnnVersionId(e.target.value)} className={fieldCls}>
                {song.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber}
                  </option>
                ))}
              </select>
              <select value={annLine} onChange={(e) => setAnnLine(Number(e.target.value))} className={`${fieldCls} flex-1 min-w-[220px] font-display`}>
                {annLines.map((l) => (
                  <option key={l.number} value={l.number}>
                    {l.block} {l.text}
                  </option>
                ))}
              </select>
            </div>
            <Input id="nt" label={t("annotationNoteLabel")} value={annNote} onChange={(e) => setAnnNote(e.target.value)} />
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={busy === "ann" || !annNote.trim()}
              onClick={() =>
                run("ann", async () => {
                  const line = annLines.find((l) => l.number === annLine);
                  await api(`/api/admin/songs/${song.id}/versions/${annVersionId}/annotations`, "POST", {
                    lineNumber: annLine,
                    lineText: line?.text ?? "",
                    note: annNote,
                  });
                  setAnnNote("");
                })
              }
            >
              {busy === "ann" && <Spinner />} {t("addAnnotation")}
            </Button>
            <ul className="mt-2 space-y-2 list-none p-0 m-0">
              {song.versions.flatMap((v) =>
                v.annotations.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 text-[12px] bg-linen rounded-[var(--radius-sm)] px-3 py-2">
                    <span>
                      <span className="font-display italic">{a.lineText}</span> — {a.note}
                    </span>
                    <button type="button" className="text-danger bg-transparent border-none cursor-pointer shrink-0" onClick={() => run(a.id, () => api(`/api/admin/songs/${song.id}/versions/${v.id}/annotations/${a.id}`, "DELETE"))}>
                      {tc("delete")}
                    </button>
                  </li>
                )),
              )}
            </ul>
          </div>

          {/* Audio previews (SA Storage) */}
          <div className={editTab === "previews" ? "flex flex-col gap-3" : "hidden"}>
            {!config.storage && config.mode !== "mock" && <p className="text-[12px] text-amber bg-amber-light rounded-[var(--radius-md)] px-3 py-2 m-0">{t("storageOff")}</p>}
            <select value={prevVersionId} onChange={(e) => setPrevVersionId(e.target.value)} className={`${fieldCls} self-start`}>
              {song.versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber}
                </option>
              ))}
            </select>
            {(config.storage || config.mode === "mock") && (
              <div className="flex flex-wrap items-center gap-2">
                <input ref={previewFileRef} type="file" accept="audio/*" className="text-[12px] max-w-[min(100%,320px)]" />
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === "prev-file"}
                  onClick={() =>
                    run("prev-file", async () => {
                      const file = previewFileRef.current?.files?.[0];
                      if (!file) return;
                      const { publicUrl, durationSeconds } = await uploadSongPreviewFile(file, song.id, prevVersionId);
                      await api(`/api/admin/songs/${song.id}/versions/${prevVersionId}/previews`, "POST", { fileUrl: publicUrl, durationSeconds });
                      if (previewFileRef.current) previewFileRef.current.value = "";
                    })
                  }
                >
                  {busy === "prev-file" && <Spinner />} {t("uploadAudio")}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-end">
              <Input id="purl" label={t("audioUrlLabel")} value={prevUrl} onChange={(e) => setPrevUrl(e.target.value)} className="flex-1 min-w-[200px]" />
              <Input id="pdur" label={t("durationSecondsLabel")} type="number" min={0} value={String(prevDur)} onChange={(e) => setPrevDur(Number(e.target.value) || 0)} className="max-w-[120px]" />
              <Button
                type="button"
                size="sm"
                disabled={busy === "prev" || !prevUrl.trim()}
                onClick={() =>
                  run("prev", async () => {
                    await api(`/api/admin/songs/${song.id}/versions/${prevVersionId}/previews`, "POST", { fileUrl: prevUrl, durationSeconds: prevDur });
                    setPrevUrl("");
                    setPrevDur(0);
                  })
                }
              >
                {tc("add")}
              </Button>
            </div>
            <ul className="mt-2 space-y-2 list-none p-0 m-0">
              {song.versions.flatMap((v) =>
                v.previews.map((p) => (
                  <li key={p.id} className="flex justify-between items-center gap-2 text-[12px]">
                    <a href={p.fileUrl} target="_blank" rel="noreferrer" className="text-forest truncate">
                      {p.fileUrl}
                    </a>
                    <span className="shrink-0">{p.durationSeconds}s</span>
                    <button type="button" className="text-danger bg-transparent border-none cursor-pointer" onClick={() => run(p.id, () => api(`/api/admin/songs/${song.id}/versions/${v.id}/previews/${p.id}`, "DELETE"))}>
                      {tc("delete")}
                    </button>
                  </li>
                )),
              )}
            </ul>
          </div>

          {/* Notes */}
          <div className={editTab === "notes" ? "flex flex-col gap-3" : "hidden"}>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} className={`w-full ${fieldCls}`} placeholder={t("noteContentPlaceholder")} />
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={busy === "note" || !newNote.trim()}
              onClick={() =>
                run("note", async () => {
                  await api(`/api/admin/songs/${song.id}/notes`, "POST", { content: newNote });
                  setNewNote("");
                })
              }
            >
              {t("addNote")}
            </Button>
            <ul className="mt-2 space-y-2 list-none p-0 m-0">
              {song.notes.map((n) => (
                <li key={n.id} className="flex justify-between gap-2 text-[13px] bg-linen rounded-[var(--radius-md)] px-3 py-2">
                  <span>{n.content}</span>
                  <button type="button" className="text-danger bg-transparent border-none cursor-pointer" onClick={() => run(n.id, () => api(`/api/admin/songs/${song.id}/notes/${n.id}`, "DELETE"))}>
                    {tc("delete")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
