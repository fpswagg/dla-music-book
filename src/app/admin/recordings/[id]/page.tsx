import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getRecording, getSungLines } from "@/lib/recordings";
import { BackLink } from "@/components/ui/back-link";
import { AdminRecording } from "@/components/admin/admin-recording";

export const dynamic = "force-dynamic";

export default async function RecordingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recording = await getRecording(id, await getCurrentUser());
  if (!recording) notFound();
  const [t, lines] = await Promise.all([getTranslations("recordings"), recording.songId ? getSungLines(recording.songId) : Promise.resolve([])]);
  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/recordings" label={t("adminTitle")} />
      <AdminRecording recording={recording} lines={lines} />
    </div>
  );
}
