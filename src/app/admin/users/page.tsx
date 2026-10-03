import type { Prisma } from "@/generated/prisma/client";
import { isEmailConfigured, isMockMode } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getMockUsers } from "@/lib/mock/provider";
import { AdminUsers, type AdminUserRow } from "@/components/admin/admin-users";
import { Pagination } from "@/components/ui/pagination";
import { getCurrentUser } from "@/lib/auth-helpers";

const PAGE_SIZE = 15;

export default async function AdminUsersPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const me = await getCurrentUser();

  let rows: AdminUserRow[] = [];
  let total = 0;

  if (isMockMode()) {
    const all = getMockUsers()
      .filter((u) => !q || u.displayName.toLowerCase().includes(q.toLowerCase()))
      .map((u) => ({
        id: u.id,
        displayName: u.displayName,
        role: u.role,
        createdAt: "2024-01-01T00:00:00Z",
        email: `${u.id}@demo.local`,
        emailVerified: true,
        banned: false,
        providers: ["credential"],
      }));
    total = all.length;
    rows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else if (prisma) {
    const where: Prisma.UserWhereInput = q
      ? { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : {};
    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { accounts: { select: { providerId: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    total = count;
    rows = users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      email: u.email.endsWith("@users.invalid") ? undefined : u.email,
      emailVerified: u.emailVerified,
      banned: u.banned,
      providers: u.accounts.map((a) => a.providerId),
    }));
  }

  return (
    <>
      <AdminUsers initialUsers={rows} currentUserId={me?.id} emailConfigured={isEmailConfigured()} />
      <Pagination pathname="/admin/users" searchParams={searchParams} page={page} total={total} pageSize={PAGE_SIZE} />
    </>
  );
}
