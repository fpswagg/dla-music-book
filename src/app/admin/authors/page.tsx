import { getAdminAuthorsList } from "@/lib/data-provider";
import { AdminAuthors } from "@/components/admin/admin-authors";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

export default async function AdminAuthorsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { authors, total } = await getAdminAuthorsList({
    q: q || undefined,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <>
      <AdminAuthors initialAuthors={authors} />
      <Pagination
        pathname="/admin/authors"
        searchParams={searchParams}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
