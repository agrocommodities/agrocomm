import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — AgroComm" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <div className="fixed inset-0 z-100 flex bg-[#2a3425] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-16 lg:pt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
