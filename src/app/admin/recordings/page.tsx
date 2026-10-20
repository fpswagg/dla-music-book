import { getTranslations } from "next-intl/server";
import { getWorkerStatus, listGlossary, listRecordings } from "@/lib/recordings";
import { SectionLabel } from "@/components/ui/section-label";
import { RecordingList } from "@/components/music/recording-list";
import { RecordingUpload } from "@/components/music/recording-upload";
import { AdminGlossary } from "@/components/admin/admin-glossary";

export const dynamic = "force-dynamic";

/** Recordings of hymns: upload, analysis results, moderation, and the Duala glossary for transcription. */
export default async function RecordingsPage() {
  const [t, recordings, terms, worker] = await Promise.all([getTranslations("recordings"), listRecordings(), listGlossary(), getWorkerStatus()]);
  const features = [
    { key: "transcription", on: !!(worker.flags.whisper || worker.flags.gemini), keys: "OPENAI_API_KEY / GEMINI_API_KEY" },
    { key: "correction", on: !!worker.flags.claude, keys: "ANTHROPIC_API_KEY" },
    { key: "singing", on: !!worker.flags.singing, keys: "AI_SINGING_URL" },
  ] as const;
  return (
    <div className="max-w-4xl font-ui">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("adminTitle")}</h1>
      <p className="text-[13px] text-green-muted mb-3">{t("adminIntro")}</p>
      <div className="mb-6 text-[12px] bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
        <span className={worker.online ? "text-forest" : "text-danger"}>{worker.online ? t("workerOnline") : t("workerOffline")}</span>
        {features.map((f) => (
          <span key={f.key} className={f.on ? "text-text-body" : "text-text-muted"} title={f.on ? undefined : t("missingKey", { keys: f.keys })}>
            {f.on ? "✓" : "–"} {t(`feature.${f.key}`)}
            {!f.on && <span className="text-[11px]"> ({t("missingKey", { keys: f.keys })})</span>}
          </span>
        ))}
      </div>
      <SectionLabel>{t("upload")}</SectionLabel>
      <RecordingUpload />
      <div className="mt-8">
        <SectionLabel>{t("allList")}</SectionLabel>
        <RecordingList recordings={recordings} admin />
      </div>
      <div className="mt-8">
        <SectionLabel>{t("glossary")}</SectionLabel>
        <AdminGlossary terms={terms.map((x) => ({ id: x.id, term: x.term, note: x.note }))} />
      </div>
    </div>
  );
}
