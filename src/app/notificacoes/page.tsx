import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserNotifications } from "@/actions/classifieds";
import NotificationsList from "@/components/NotificationsList";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notificações — AgroComm",
};

export default async function NotificacoesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await getUserNotifications();

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[{ label: "Notificações" }]} />
      <h1 className="text-2xl font-bold mb-6">Notificações</h1>
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
