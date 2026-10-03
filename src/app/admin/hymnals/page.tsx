import { getHymnals } from "@/lib/data-provider";
import { AdminHymnals } from "@/components/admin/admin-hymnals";

export default async function AdminHymnalsPage() {
  return <AdminHymnals hymnals={await getHymnals()} />;
}
