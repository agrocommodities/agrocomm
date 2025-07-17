import { getCurrentUser } from "@/lib/user";
import Account from "@/components/auth/account";

export default async function AccountWrapper() {
  const rawUser = await getCurrentUser({ withFullUser: true });
  
  const user = rawUser ? {
    ...rawUser,
    name: rawUser.name || undefined,
    username: rawUser.username || undefined
  } : null;
  
  return <Account user={user} />;
}
