import { getTranslations } from "next-intl/server";
import { listGlossary, listRecordings } from "@/lib/recordings";
import { SectionLabel } from "@/components/ui/section-label";
import { RecordingList } from "@/components/music/recording-list";
import { RecordingUpload } from "@/components/music/recording-upload";
import { AdminGlossary } from "@/components/admin/admin-glossary";

export const dynamic = "force-dynamic";

/** Recordings of hymns: upload, analysis results, moderation, and the Duala glossary for transcription. */
export default async function RecordingsPage() {
  const [t, recordings, terms] = await Promise.all([getTranslations("recordings"), listRecordings(), listGlossary()]);
  return (
    <div className="max-w-4xl font-ui">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("adminTitle")}</h1>
      <p className="text-[13px] text-green-muted mb-5">{t("adminIntro")}</p>
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
