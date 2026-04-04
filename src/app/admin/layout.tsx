import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isMockMode } from "@/lib/env";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isMockMode()) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") redirect("/");
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
