// src/app/(main)/admin/page.tsx
import { getCurrentUser } from "@/lib/user";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return <AdminDashboard />;
}