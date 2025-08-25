// src/components/admin/subscriptions-table.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface SubscriptionData {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions?page=${currentPage}&search=${search}`);
      const data = await response.json();
      setSubscriptions(data.subscriptions);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Erro ao buscar assinaturas:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleStatusChange = async (subscriptionId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchSubscriptions();
      } else {
        alert("Erro ao atualizar status da assinatura");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status da assinatura");
    }
  };

  const handleDeleteSubscription = async (subscriptionId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta assinatura?")) return;

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSubscriptions();
      } else {
        alert("Erro ao deletar assinatura");
      }
    } catch (error) {
      console.error("Erro ao deletar assinatura:", error);
      alert("Erro ao deletar assinatura");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'canceled': return 'bg-red-500/20 text-red-400';
      case 'expired': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Gerenciar Assinaturas</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar assinaturas..."
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
                  <th className="pb-3 text-gray-300 font-medium">Usuário</th>
                  <th className="pb-3 text-gray-300 font-medium">Plano</th>
                  <th className="pb-3 text-gray-300 font-medium">Preço</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Início</th>
                  <th className="pb-3 text-gray-300 font-medium">Fim</th>
                  <th className="pb-3 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-white/10">
                    <td className="py-3 text-white">{subscription.id}</td>
                    <td className="py-3 text-white">
                      <div>
                        <div>{subscription.user.name}</div>
                        <div className="text-sm text-gray-400">{subscription.user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-white">{subscription.plan.name}</td>
                    <td className="py-3 text-white">R$ {(subscription.plan.price / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={subscription.status}
                          onChange={(e) => handleStatusChange(subscription.id, e.target.value)}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="active">Ativa</option>
                          <option value="canceled">Cancelada</option>
                          <option value="expired">Expirada</option>
                        </select>
                        {isExpiringSoon(subscription.currentPeriodEnd) && (
                          <span className="text-yellow-400 text-xs" title="Expira em breve">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-gray-300 text-sm">
                      {formatDate(subscription.currentPeriodStart)}
                    </td>
                    <td className="py-3 text-gray-300 text-sm">
                      <span className={isExpiringSoon(subscription.currentPeriodEnd) ? 'text-yellow-400' : ''}>
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Deletar assinatura"
                      >
                        🗑️
                      </button>
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
    </div>
  );
}