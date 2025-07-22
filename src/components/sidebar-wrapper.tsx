import { getCurrentUser } from "@/lib/user";
import Sidebar from "@/components/sidebar";

export default async function SidebarWrapper() {
  const user = await getCurrentUser();
  
  return <Sidebar user={user} />;
}