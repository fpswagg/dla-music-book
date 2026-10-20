import { listTunes } from "@/lib/scores";
import { getTuneProposals } from "@/lib/tune-suggestions";
import { AdminTunes } from "@/components/admin/admin-tunes";

export const dynamic = "force-dynamic";

export default async function AdminTunesPage() {
  const [tunes, proposals] = await Promise.all([listTunes("", 1000), getTuneProposals()]);
  return <AdminTunes tunes={tunes} proposals={proposals} />;
}
