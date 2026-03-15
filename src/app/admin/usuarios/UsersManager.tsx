"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Shield, ShieldOff, X } from "lucide-react";
import {
  deleteUserAction,
  updateUserRoleAction,
  createUserAction,
} from "@/actions/admin";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition w-full";

export default function UsersManager({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [showForm, setShowForm] = useState(false);
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

  function handleToggleRole(id: number, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const msg =
      newRole === "admin"
        ? "Promover este usuário a administrador?"
        : "Remover privilégios de administrador?";
    if (!confirm(msg)) return;
    startTransition(async () => {
      const result = await updateUserRoleAction(id, newRole);
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
              <label htmlFor="role" className="text-xs text-white/60">
                Papel
              </label>
              <select id="role" name="role" className={inputClass}>
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
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
                <th className="text-left px-5 py-3 font-medium">Papel</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                  Cadastro
                </th>
                <th className="text-right px-5 py-3 font-medium w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-white/30">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3 font-medium">{user.name}</td>
                    <td className="px-5 py-3 text-white/60 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs hidden md:table-cell">
                      {user.createdAt}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(user.id, user.role)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-purple-500/20 text-white/30 hover:text-purple-400 transition-colors"
                          title={
                            user.role === "admin"
                              ? "Remover admin"
                              : "Tornar admin"
                          }
                        >
                          {user.role === "admin" ? (
                            <ShieldOff className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
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
    </>
  );
}
