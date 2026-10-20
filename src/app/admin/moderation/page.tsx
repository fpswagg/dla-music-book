import { getTranslations } from "next-intl/server";
import { getScoreQueue } from "@/lib/scores";
import { ScoreList } from "@/components/music/score-list";
import { getWorkerStatus, listRecordings } from "@/lib/recordings";
import { RecordingList } from "@/components/music/recording-list";
import { SectionLabel } from "@/components/ui/section-label";

export const dynamic = "force-dynamic";

/** Everything contributors sent that is not published yet. */
export default async function ModerationPage() {
  const [t, tr, queue, recordings, worker] = await Promise.all([getTranslations("music"), getTranslations("recordings"), getScoreQueue(), listRecordings({ status: "DRAFT" }), getWorkerStatus()]);
  return (
    <div className="max-w-4xl font-ui">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("moderationTitle")}</h1>
      <p className="text-[13px] text-green-muted mb-5">{t("moderationIntro")}</p>
      <SectionLabel>{t("scoresQueue")}</SectionLabel>
      <ScoreList scores={queue} admin showTune aiSinging={!!worker.flags.singing} />
      <div className="mt-8">
        <SectionLabel>{tr("all")}</SectionLabel>
        <RecordingList recordings={recordings} admin />
      </div>
    </div>
  );
}
