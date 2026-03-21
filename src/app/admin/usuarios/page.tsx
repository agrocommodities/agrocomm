import {
  getAdminUsers,
  getAdminRoles,
  getAdminPermissions,
  getAllUserPermissionOverrides,
} from "@/actions/admin";
import UsersManager from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, roles, permissions, overrides] = await Promise.all([
    getAdminUsers(),
    getAdminRoles(),
    getAdminPermissions(),
    getAllUserPermissionOverrides(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        <p className="text-sm text-white/50 mt-1">
          Gerencie usuários, cargos e permissões
        </p>
      </div>

      <UsersManager
        initialUsers={users}
        initialRoles={roles}
        initialPermissions={permissions}
        initialOverrides={overrides}
      />
    </div>
  );
}
