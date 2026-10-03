"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { AdminUsersListToolbar } from "@/components/admin/admin-list-toolbar";

export type AdminUserRow = {
  id: string;
  displayName: string;
  role: string;
  createdAt?: string;
  email?: string;
  emailVerified: boolean;
  banned: boolean;
  providers: string[];
};

export function AdminUsers({
  initialUsers,
  currentUserId,
  emailConfigured,
}: {
  initialUsers: AdminUserRow[];
  currentUserId?: string;
  emailConfigured: boolean;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ name: string; link: string } | null>(null);
  const [error, setError] = useState("");

  const btn = "bg-sand text-text-body rounded-[var(--radius-md)] px-2.5 py-1 text-[11px] hover:bg-stone cursor-pointer border-none disabled:opacity-50";
  const btnDanger =
    "bg-transparent border-[0.5px] border-danger text-danger rounded-[var(--radius-md)] px-2.5 py-1 text-[11px] hover:bg-danger-light cursor-pointer disabled:opacity-50";

  async function call(userId: string, url: string, init: RequestInit) {
    setBusy(userId);
    setError("");
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = (await res.json().catch(() => ({}))) as { error?: string; link?: string; sent?: boolean };
      if (!res.ok) setError(data.error === "NO_EMAIL" ? t("userNoEmail") : (data.error ?? tc("error")));
      return res.ok ? data : null;
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  const reset = async (u: AdminUserRow, mode: "email" | "link") => {
    const data = await call(u.id, `/api/admin/users/${u.id}/reset-password`, { method: "POST", body: JSON.stringify({ mode }) });
    if (data?.link) setResetLink({ name: u.displayName, link: data.link });
    else if (data?.sent) window.alert(t("resetEmailSent", { email: u.email ?? "" }));
  };

  return (
    <div>
      <h1 className="text-[28px] text-deep font-display mb-2">{t("users")}</h1>
      {!emailConfigured && <p className="text-[12px] text-amber bg-amber-light rounded-[var(--radius-md)] px-3 py-2 mb-4">{t("usersEmailOff")}</p>}

      <AdminUsersListToolbar />

      {error && (
        <p role="alert" className="text-[12px] text-danger mb-3">
          {error}
        </p>
      )}

      {resetLink && (
        <div className="mb-4 bg-green-light border-[0.5px] border-forest rounded-[var(--radius-md)] p-3">
          <p className="text-[12px] text-forest m-0 mb-2">{t("resetLinkFor", { name: resetLink.name })}</p>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              value={resetLink.link}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-sm)] px-2 py-1.5 text-[12px]"
            />
            <button type="button" className={btn} onClick={() => navigator.clipboard?.writeText(resetLink.link)}>
              {t("copy")}
            </button>
            <button type="button" className={btn} onClick={() => setResetLink(null)}>
              {tc("close")}
            </button>
          </div>
        </div>
      )}

      <div className="bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b-[0.5px] border-b-stone">
              {[t("tableName"), t("userEmail"), t("tableRole"), t("tableJoined"), t("tableActions")].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user, i) => {
              const self = user.id === currentUserId;
              return (
                <tr key={user.id} className={`border-b-[0.5px] border-b-stone last:border-b-0 ${i % 2 ? "bg-linen" : ""}`}>
                  <td className="px-4 py-3 text-[14px] text-deep">
                    {user.displayName}
                    {user.banned && (
                      <span className="ml-2 px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] bg-danger-light text-danger">{t("banned")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-muted max-w-[220px]">
                    <span className="block truncate">{user.email ?? t("noEmail")}</span>
                    <span className="block text-[10px]">
                      {user.providers.map((p) => (p === "credential" ? t("providerPassword") : p === "google" ? "Google" : p)).join(" · ")}
                      {user.email && !user.emailVerified && ` · ${t("unverified")}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium ${
                        user.role === "ADMIN" ? "bg-green-light text-forest" : "bg-sand text-text-muted"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-muted">
                    {user.createdAt ? format.dateTime(new Date(user.createdAt), { dateStyle: "medium" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {self ? (
                      <span className="text-[11px] text-text-muted">{t("you")}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy === user.id}
                          className={btn}
                          onClick={() =>
                            call(user.id, `/api/admin/users/${user.id}`, {
                              method: "PUT",
                              body: JSON.stringify({ role: user.role === "ADMIN" ? "USER" : "ADMIN" }),
                            })
                          }
                        >
                          {user.role === "ADMIN" ? t("makeUser") : t("makeAdmin")}
                        </button>
                        <button
                          type="button"
                          disabled={busy === user.id}
                          className={btn}
                          onClick={() =>
                            confirm(t("confirmBan")) &&
                            call(user.id, `/api/admin/users/${user.id}/ban`, { method: "POST", body: JSON.stringify({ banned: !user.banned }) })
                          }
                        >
                          {user.banned ? t("unbanUser") : t("banUser")}
                        </button>
                        {user.email && (
                          <>
                            <button type="button" disabled={busy === user.id} className={btn} onClick={() => reset(user, "link")}>
                              {t("resetLink")}
                            </button>
                            {emailConfigured && (
                              <button type="button" disabled={busy === user.id} className={btn} onClick={() => reset(user, "email")}>
                                {t("resetEmail")}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          disabled={busy === user.id}
                          className={btnDanger}
                          onClick={() => confirm(t("confirmDeleteUser")) && call(user.id, `/api/admin/users/${user.id}`, { method: "DELETE" })}
                        >
                          {tc("delete")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
