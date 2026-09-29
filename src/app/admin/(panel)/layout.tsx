import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Auryx Admin" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  async function signOut() {
    "use server";
    const a = await requireAdmin();
    await audit(a.email, "admin.logout");
    await logout();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-surface">
      <AdminNav email={admin.email} logout={signOut} />
      <div className="lg:pl-64">
        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
