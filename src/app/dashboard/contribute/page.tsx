import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canContribute, getCurrentUser } from "@/lib/auth-helpers";
import { getMyScores } from "@/lib/scores";
import { SectionLabel } from "@/components/ui/section-label";
import { ScoreUpload } from "@/components/music/score-upload";
import { ScoreList } from "@/components/music/score-list";
import { listRecordings } from "@/lib/recordings";
import { RecordingUpload } from "@/components/music/recording-upload";
import { RecordingList } from "@/components/music/recording-list";

export const dynamic = "force-dynamic";

/** Contributors send scores; each one waits as a draft until an admin publishes it. */
export default async function ContributePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/dashboard/contribute");
  if (!canContribute(user)) redirect("/dashboard");
  const [t, scores, recordings] = await Promise.all([getTranslations("contribute"), getMyScores(user), listRecordings({ mine: user })]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[28px] text-deep font-display m-0 mb-2">{t("title")}</h1>
      <p className="text-[13px] text-green-muted mb-6 font-ui">{t("intro")}</p>
      <SectionLabel>{t("send")}</SectionLabel>
      <ScoreUpload />
      <div className="mt-10">
        <SectionLabel>{t("mine")}</SectionLabel>
        <ScoreList scores={scores} showTune admin={user.role === "ADMIN"} />
      </div>
      <div className="mt-10">
        <SectionLabel>{t("sendRecording")}</SectionLabel>
        <RecordingUpload />
      </div>
      <div className="mt-10">
        <SectionLabel>{t("myRecordings")}</SectionLabel>
        <RecordingList recordings={recordings} admin={user.role === "ADMIN"} />
      </div>
    </div>
  );
}
