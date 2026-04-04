import { getAdminCollectionsList } from "@/lib/data-provider";
import { AdminCollections } from "@/components/admin/admin-collections";
import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockUsers } from "@/lib/mock/provider";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

export default async function AdminCollectionsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { collections, total } = await getAdminCollectionsList({
    q: q || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  let users: Array<{ id: string; displayName: string }> = [];
  if (isMockMode()) {
    users = getMockUsers().map((u) => ({ id: u.id, displayName: u.displayName }));
  } else if (prisma) {
    users = await prisma.userProfile.findMany({
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    });
  }

  return (
    <>
      <AdminCollections initialCollections={collections} users={users} />
      <Pagination
        pathname="/admin/collections"
        searchParams={searchParams}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
