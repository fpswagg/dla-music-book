"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminUsersListToolbar } from "@/components/admin/admin-list-toolbar";

type User = {
  id: string;
  displayName: string;
  role: string;
  createdAt?: string;
  email?: string;
};

export function AdminUsers({ initialUsers }: { initialUsers: User[] }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const btnPrimary =
    "bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-3 py-1.5 text-[12px] font-[var(--font-ui)] hover:bg-[var(--color-deep)] transition-colors cursor-pointer border-none disabled:opacity-50";
  const btnSecondary =
    "bg-[var(--color-sand)] text-[var(--color-text-body)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-stone)] cursor-pointer border-none disabled:opacity-50";
  const btnDanger =
    "bg-transparent border-[0.5px] border-[var(--color-amber)] text-[var(--color-amber)] rounded-[var(--radius-md)] px-2 py-1 text-[11px] font-[var(--font-ui)] hover:bg-[var(--color-amber-light)] cursor-pointer disabled:opacity-50";

  async function handleRoleToggle(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    setBusy(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleBan(userId: string, banned: boolean) {
    if (!confirm(t("confirmBan"))) return;
    setBusy(userId);
    try {
      await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleResetPassword(userId: string) {
    if (!confirm(t("confirmResetPassword"))) return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.actionLink && typeof window !== "undefined") {
        window.alert(t("resetLinkCreated"));
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm(t("confirmDeleteUser"))) return;
    setBusy(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] mb-6">
        {t("users")}
      </h1>

      <AdminUsersListToolbar />

      <div className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b-[0.5px] border-b-[var(--color-stone)]">
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
                {t("tableName")}
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
                {t("userEmail")}
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
                {t("tableRole")}
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
                {t("tableJoined")}
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]">
                {t("tableActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b-[0.5px] border-b-[var(--color-stone)] last:border-b-0 ${
                  i % 2 === 1 ? "bg-[var(--color-linen)]" : ""
                }`}
              >
                <td className="px-4 py-3 text-[14px] text-[var(--color-deep)] font-[var(--font-ui)]">
                  {user.displayName}
                </td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)] max-w-[180px] truncate">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium font-[var(--font-ui)] ${
                      user.role === "ADMIN"
                        ? "bg-[var(--color-green-light)] text-[var(--color-forest)]"
                        : "bg-[var(--color-sand)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      disabled={busy === user.id}
                      className={btnPrimary}
                    >
                      {user.role === "ADMIN" ? t("makeUser") : t("makeAdmin")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBan(user.id, true)}
                      disabled={busy === user.id}
                      className={btnSecondary}
                    >
                      {t("banUser")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBan(user.id, false)}
                      disabled={busy === user.id}
                      className={btnSecondary}
                    >
                      {t("unbanUser")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(user.id)}
                      disabled={busy === user.id}
                      className={btnSecondary}
                    >
                      {t("resetPassword")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      disabled={busy === user.id}
                      className={btnDanger}
                    >
                      {tc("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
