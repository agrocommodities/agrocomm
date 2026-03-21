"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Shield,
  Key,
  Save,
  Users,
  Lock,
  Eye,
  UserX,
} from "lucide-react";
import {
  deleteUserAction,
  updateUserRoleAction,
  createUserAction,
  createRoleAction,
  deleteRoleAction,
  updateRolePermissionsAction,
  updateUserPermissionsAction,
  impersonateUserAction,
  impersonateVisitorAction,
} from "@/actions/admin";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  roleName: string | null;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isSystem: number;
  createdAt: string;
  permissionIds: number[];
}

interface Permission {
  id: number;
  key: string;
  name: string;
  description: string | null;
  category: string;
}

interface UserPermOverride {
  id: number;
  userId: number;
  permissionId: number;
  granted: number;
}

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition w-full";

const tabClass = (active: boolean) =>
  `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
    active
      ? "bg-green-600/20 text-green-400"
      : "text-white/50 hover:text-white hover:bg-white/5"
  }`;

export default function UsersManager({
  initialUsers,
  initialRoles,
  initialPermissions,
  initialOverrides,
}: {
  initialUsers: User[];
  initialRoles: Role[];
  initialPermissions: Permission[];
  initialOverrides: UserPermOverride[];
}) {
  const [tab, setTab] = useState<"users" | "roles">("users");

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={tabClass(tab === "users")}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários ({initialUsers.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("roles")}
          className={tabClass(tab === "roles")}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Cargos ({initialRoles.length})
          </span>
        </button>
      </div>

      {tab === "users" ? (
        <UsersTab
          users={initialUsers}
          roles={initialRoles}
          permissions={initialPermissions}
          overrides={initialOverrides}
        />
      ) : (
        <RolesTab roles={initialRoles} permissions={initialPermissions} />
      )}
    </>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  roles,
  permissions,
  overrides,
}: {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  overrides: UserPermOverride[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir o usuário "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteUserAction(id);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleImpersonate(id: number, name: string) {
    if (
      !confirm(
        `Impersonificar o usuário "${name}"? Você verá o site como este usuário.`,
      )
    )
      return;
    startTransition(async () => {
      const result = await impersonateUserAction(id);
      if (result.error) alert(result.error);
      else window.location.href = "/";
    });
  }

  function handleImpersonateVisitor() {
    if (
      !confirm(
        "Impersonificar visitante? Você verá o site como usuário deslogado.",
      )
    )
      return;
    startTransition(async () => {
      const result = await impersonateVisitorAction();
      if (result.error) alert(result.error);
      else window.location.href = "/";
    });
  }

  function handleRoleChange(userId: number, roleIdStr: string) {
    const roleId = roleIdStr === "" ? null : Number(roleIdStr);
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, roleId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  async function handleCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  const permUser = permUserId ? users.find((u) => u.id === permUserId) : null;

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleImpersonateVisitor}
          disabled={isPending}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <UserX className="w-4 h-4" />
          Impersonificar Visitante
        </button>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Novo Usuário"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          action={handleCreate}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4">Criar Usuário</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs text-white/60">
                Nome *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Nome completo"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs text-white/60">
                E-mail *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@exemplo.com"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs text-white/60">
                Senha * (mín. 8 caracteres)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="roleId" className="text-xs text-white/60">
                Cargo
              </label>
              <select id="roleId" name="roleId" className={inputClass}>
                <option value="">Sem cargo</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
          >
            {isPending ? "Criando…" : "Criar Usuário"}
          </button>
        </form>
      )}

      {/* Users table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Nome</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  E-mail
                </th>
                <th className="text-left px-5 py-3 font-medium">Cargo</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                  Cadastro
                </th>
                <th className="text-right px-5 py-3 font-medium w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-white/30">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3 font-medium">{user.name}</td>
                    <td className="px-5 py-3 text-white/60 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={user.roleId ?? ""}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        disabled={isPending}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/50"
                      >
                        <option value="">Sem cargo</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs hidden md:table-cell">
                      {user.createdAt}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleImpersonate(user.id, user.name)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-white/30 hover:text-blue-400 transition-colors"
                          title="Impersonificar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermUserId(user.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-white/30 hover:text-yellow-400 transition-colors"
                          title="Permissões individuais"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User permissions modal */}
      {permUser && (
        <UserPermissionsModal
          user={permUser}
          roles={roles}
          permissions={permissions}
          overrides={overrides.filter((o) => o.userId === permUser.id)}
          onClose={() => setPermUserId(null)}
        />
      )}
    </>
  );
}

// ── User Permissions Modal ────────────────────────────────────────────────────

function UserPermissionsModal({
  user,
  roles,
  permissions,
  overrides,
  onClose,
}: {
  user: User;
  roles: Role[];
  permissions: Permission[];
  overrides: UserPermOverride[];
  onClose: () => void;
}) {
  const userRole = roles.find((r) => r.id === user.roleId);
  const rolePermIds = new Set(userRole?.permissionIds ?? []);

  // State: map of permissionId → "default" | "grant" | "revoke"
  const initialState: Record<string, string> = {};
  for (const p of permissions) {
    const override = overrides.find((o) => o.permissionId === p.id);
    if (override) {
      initialState[p.id] = override.granted ? "grant" : "revoke";
    } else {
      initialState[p.id] = "default";
    }
  }
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    const overrideEntries: { permissionId: number; granted: number }[] = [];
    for (const p of permissions) {
      const val = state[p.id];
      if (val === "grant") {
        overrideEntries.push({ permissionId: p.id, granted: 1 });
      } else if (val === "revoke") {
        overrideEntries.push({ permissionId: p.id, granted: 0 });
      }
    }
    startTransition(async () => {
      const result = await updateUserPermissionsAction(
        user.id,
        overrideEntries,
      );
      if ("error" in result) alert(result.error);
      else {
        router.refresh();
        onClose();
      }
    });
  }

  const categories = [...new Set(permissions.map((p) => p.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#2a3425] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="font-semibold">Permissões de {user.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Cargo: {userRole?.name ?? "Sem cargo"} — Sobrescreva permissões
              individualmente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {categories.map((cat) => (
            <div key={cat} className="mb-5">
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                {cat}
              </h4>
              <div className="space-y-2">
                {permissions
                  .filter((p) => p.category === cat)
                  .map((perm) => {
                    const fromRole = rolePermIds.has(perm.id);
                    const val = state[perm.id] ?? "default";
                    const effective =
                      val === "default" ? fromRole : val === "grant";

                    return (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              effective ? "bg-green-400" : "bg-white/20"
                            }`}
                          />
                          <span className="text-sm truncate">{perm.name}</span>
                          {fromRole && val === "default" && (
                            <span className="text-[10px] text-white/30 shrink-0">
                              (cargo)
                            </span>
                          )}
                        </div>
                        <select
                          value={val}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              [perm.id]: e.target.value,
                            }))
                          }
                          className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400/50 shrink-0"
                        >
                          <option value="default">
                            Padrão{fromRole ? " (sim)" : " (não)"}
                          </option>
                          <option value="grant">✅ Conceder</option>
                          <option value="revoke">🚫 Revogar</option>
                        </select>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Roles Tab ─────────────────────────────────────────────────────────────────

function RolesTab({
  roles,
  permissions,
}: {
  roles: Role[];
  permissions: Permission[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreateRole(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createRoleAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleDeleteRole(roleId: number, roleName: string) {
    if (
      !confirm(`Excluir o cargo "${roleName}"? Usuários perderão este cargo.`)
    )
      return;
    startTransition(async () => {
      const result = await deleteRoleAction(roleId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Novo Cargo"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          action={handleCreateRole}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4">Criar Cargo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="roleName" className="text-xs text-white/60">
                Nome *
              </label>
              <input
                id="roleName"
                name="name"
                type="text"
                required
                placeholder="Ex: Gerente"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="roleDescription"
                className="text-xs text-white/60"
              >
                Descrição
              </label>
              <input
                id="roleDescription"
                name="description"
                type="text"
                placeholder="Descrição opcional"
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
          >
            {isPending ? "Criando…" : "Criar Cargo"}
          </button>
        </form>
      )}

      {/* Roles list */}
      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    role.isSystem
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-green-600/20 text-green-400"
                  }`}
                >
                  {role.isSystem ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{role.name}</h3>
                  {role.description && (
                    <p className="text-xs text-white/40">{role.description}</p>
                  )}
                </div>
                {role.isSystem === 1 && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                    SISTEMA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingRole(editingRole === role.id ? null : role.id)
                  }
                  className="text-xs text-white/50 hover:text-green-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  {editingRole === role.id
                    ? "Fechar"
                    : `Permissões (${role.permissionIds.length})`}
                </button>
                {!role.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    title="Excluir cargo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {editingRole === role.id && (
              <RolePermissionsEditor role={role} permissions={permissions} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Role Permissions Editor ───────────────────────────────────────────────────

function RolePermissionsEditor({
  role,
  permissions,
}: {
  role: Role;
  permissions: Permission[];
}) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(role.permissionIds),
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const categories = [...new Set(permissions.map((p) => p.category))];

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    const catPermIds = permissions
      .filter((p) => p.category === cat)
      .map((p) => p.id);
    const allSelected = catPermIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of catPermIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateRolePermissionsAction(role.id, [...selected]);
      if ("error" in result) alert(result.error);
      else router.refresh();
    });
  }

  const hasChanges =
    selected.size !== role.permissionIds.length ||
    !role.permissionIds.every((id) => selected.has(id));

  return (
    <div className="px-5 py-4">
      {categories.map((cat) => {
        const catPerms = permissions.filter((p) => p.category === cat);
        const allSelected = catPerms.every((p) => selected.has(p.id));
        const someSelected =
          !allSelected && catPerms.some((p) => selected.has(p.id));

        return (
          <div key={cat} className="mb-4">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-wide mb-2 hover:text-white/60 transition-colors"
            >
              <span
                className={`w-3 h-3 rounded border transition-colors flex items-center justify-center text-[8px] ${
                  allSelected
                    ? "bg-green-500 border-green-500 text-white"
                    : someSelected
                      ? "bg-green-500/30 border-green-500/50"
                      : "border-white/30"
                }`}
              >
                {allSelected && "✓"}
              </span>
              {cat}
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5">
              {catPerms.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(perm.id)}
                    onChange={() => toggle(perm.id)}
                    className="accent-green-500 rounded"
                  />
                  <span
                    className={selected.has(perm.id) ? "" : "text-white/40"}
                  >
                    {perm.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {hasChanges && (
        <div className="flex justify-end pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Salvando…" : "Salvar Permissões"}
          </button>
        </div>
      )}
    </div>
  );
}
