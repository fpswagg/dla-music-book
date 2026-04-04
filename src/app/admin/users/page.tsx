import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockUsers } from "@/lib/mock/provider";
import { AdminUsers } from "@/components/admin/admin-users";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 15;

export default async function AdminUsersPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  type Row = {
    id: string;
    displayName: string;
    role: string;
    createdAt?: string;
    email?: string;
  };

  let users: Row[] = [];

  if (isMockMode()) {
    users = getMockUsers().map((u) => ({
      id: u.id,
      displayName: u.displayName,
      role: u.role,
      createdAt: "2024-01-01T00:00:00Z",
    }));
  } else if (prisma) {
    const dbUsers = await prisma.userProfile.findMany({ orderBy: { createdAt: "desc" } });
    const admin = createSupabaseAdminClient();
    users = await Promise.all(
      dbUsers.map(async (u) => {
        let email: string | undefined;
        if (admin) {
          const { data } = await admin.auth.admin.getUserById(u.supabaseUserId);
          email = data.user?.email ?? undefined;
        }
        return {
          id: u.id,
          displayName: u.displayName,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
          email,
        };
      }),
    );
  }

  let filtered = users;
  if (q) {
    filtered = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }
  const total = filtered.length;
  const skip = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(skip, skip + PAGE_SIZE);

  return (
    <>
      <AdminUsers initialUsers={pageRows} />
      <Pagination
        pathname="/admin/users"
        searchParams={searchParams}
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
