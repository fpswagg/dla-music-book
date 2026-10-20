import { getTranslations } from "next-intl/server";
import { getScoreQueue } from "@/lib/scores";
import { ScoreList } from "@/components/music/score-list";

export const dynamic = "force-dynamic";

/** Everything contributors sent that is not published yet. */
export default async function ModerationPage() {
  const [t, queue] = await Promise.all([getTranslations("music"), getScoreQueue()]);
  return (
    <div className="max-w-4xl font-ui">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("moderationTitle")}</h1>
      <p className="text-[13px] text-green-muted mb-5">{t("moderationIntro")}</p>
      <ScoreList scores={queue} admin showTune />
    </div>
  );
}
