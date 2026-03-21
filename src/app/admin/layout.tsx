import { redirect } from "next/navigation";
import { getSession, getUserPermissions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin \u2014 AgroComm" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) redirect("/");

  return (
    <div className="fixed inset-0 z-100 flex flex-col lg:flex-row bg-[#2a3425] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
