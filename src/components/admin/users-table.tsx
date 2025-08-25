"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import { SubscriptionModal } from "./subscription-modal";

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${currentPage}&search=${search}`);
      const data = await response.json();
      
      // Processar dados para mostrar apenas assinatura ativa mais recente
      const processedUsers = data.users.map((user: any) => ({
        ...user,
        subscription: user.subscriptions?.find((sub: any) => sub.status === 'active') || null
      }));
      
      setUsers(processedUsers);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getCurrentUserId = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
    }
  };

  useEffect(() => {
    getCurrentUserId();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert("Erro ao atualizar role: " + error.error);
      }
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      alert("Erro ao atualizar role do usuário");
    }
  };

  const handleVerifyToggle = async (userId: number, newVerified: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVerified }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert("Erro ao atualizar verificação: " + error.error);
      }
    } catch (error) {
      console.error("Erro ao atualizar verificação:", error);
      alert("Erro ao atualizar verificação do usuário");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert("Erro ao deletar usuário: " + error.error);
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
    }
  };

  const handleManageSubscription = (user: User) => {
    setSelectedUser(user);
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    fetchUsers();
    setShowSubscriptionModal(false);
    setSelectedUser(null);
  };

  if (!users.length) {
    return (
      <div className="text-center py-8 text-gray-300">Nenhum usuário encontrado.</div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Gerenciar Usuários</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-300">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-3 text-gray-300 font-medium">ID</th>
                  <th className="pb-3 text-gray-300 font-medium">Nome</th>
                  <th className="pb-3 text-gray-300 font-medium">Email</th>
                  <th className="pb-3 text-gray-300 font-medium">Role</th>
                  <th className="pb-3 text-gray-300 font-medium">Verificado</th>
                  <th className="pb-3 text-gray-300 font-medium">Assinatura</th>
                  <th className="pb-3 text-gray-300 font-medium">Criado em</th>
                  <th className="pb-3 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user?.id} className="border-b border-white/10">
                    <td className="py-3 text-white">{user?.id}</td>
                    <td className="py-3 text-white">{user?.name || user?.username}</td>
                    <td className="py-3 text-white">{user?.email}</td>
                    <td className="py-3">
                      <select
                        value={user?.role}
                        onChange={(e) => user && handleRoleChange(user.id, e.target.value)}
                        disabled={user?.id === currentUserId}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="guest">Guest</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user?.id === currentUserId && (
                        <span className="block text-xs text-gray-400 mt-1">
                          (Você mesmo)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => user && handleVerifyToggle(user.id, !user.verified)}
                        disabled={user?.id === currentUserId}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          user?.verified 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {user?.verified ? '✓ Verificado' : '✗ Não verificado'}
                      </button>
                    </td>
                    <td className="py-3">
                      {user?.subscription?.plan ? (
                        <div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.subscription.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.subscription.planName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem assinatura</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-300 text-sm">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManageSubscription(user)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          title="Gerenciar assinatura"
                        >
                          💳
                        </button>
                        <button
                          onClick={() => user?.id !== undefined && handleDeleteUser(user.id)}
                          disabled={user?.id === currentUserId}
                          className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Deletar usuário"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-white">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white/10 text-white rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </>
      )}

      {/* Modal de gerenciamento de assinatura */}
      {showSubscriptionModal && selectedUser && (
        <SubscriptionModal
          userId={selectedUser.id}
          userName={selectedUser.name || selectedUser.username}
          currentSubscription={selectedUser.subscription}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
}