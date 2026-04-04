import { getAdminTagsList } from "@/lib/data-provider";
import { AdminTags } from "@/components/admin/admin-tags";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export default async function AdminTagsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const category = searchParams.category ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const { tags, total } = await getAdminTagsList({
    q: q || undefined,
    category: category === "MOOD" || category === "THEME" || category === "STYLE" || category === "ERA"
      ? category
      : undefined,
    page,
    limit: PAGE_SIZE,
  });

  return (
    <>
      <AdminTags initialTags={tags} />
      <Pagination
        pathname="/admin/tags"
        searchParams={searchParams}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
