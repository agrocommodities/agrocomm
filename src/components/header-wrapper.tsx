import { getCurrentUser } from "@/lib/user";
import Header from "@/components/header";

export default async function HeaderWrapper() {
  const user = await getCurrentUser();

  return <Header user={user} />;
}