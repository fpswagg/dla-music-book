import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isMockMode } from "@/lib/env";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isMockMode()) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-[var(--color-parchment)] p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
