import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getTune } from "@/lib/scores";
import { sourceLinks } from "@/lib/music/tune-sources";
import { AdminTune } from "@/components/admin/admin-tune";

export const dynamic = "force-dynamic";

export default async function AdminTunePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tune = await getTune(id, await getCurrentUser());
  if (!tune) notFound();
  return <AdminTune tune={tune} links={sourceLinks(tune.name)} />;
}
