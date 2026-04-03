import { isMockMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMockUsers } from "@/lib/mock/provider";
import { SectionLabel } from "@/components/ui/section-label";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin");
  let users: Array<{ id: string; displayName: string; role: string; createdAt?: string }> = [];

  if (isMockMode()) {
    users = getMockUsers().map(u => ({ ...u, createdAt: "2024-01-01T00:00:00Z" }));
  } else if (prisma) {
    const dbUsers = await prisma.userProfile.findMany({ orderBy: { createdAt: "desc" } });
    users = dbUsers.map(u => ({ id: u.id, displayName: u.displayName, role: u.role, createdAt: u.createdAt.toISOString() }));
  }

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">{t("users")}</h1>
      <SectionLabel>{t("usersCount", { count: users.length })}</SectionLabel>
      <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-[0.5px] border-b-[var(--color-stone)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableName")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableRole")}</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("tableJoined")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0">
                <td className="px-4 py-3 text-[14px] text-[var(--color-deep)] font-[var(--font-ui)]">{user.displayName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium font-[var(--font-ui)] ${user.role === "ADMIN" ? "bg-[var(--color-green-light)] text-[var(--color-forest)]" : "bg-[var(--color-sand)] text-[var(--color-text-muted)]"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
