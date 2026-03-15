import { getAdminUsers } from "@/actions/admin";
import UsersManager from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        <p className="text-sm text-white/50 mt-1">
          {users.length} usuário{users.length !== 1 && "s"} cadastrado
          {users.length !== 1 && "s"}
        </p>
      </div>

      <UsersManager initialUsers={users} />
    </div>
  );
}
