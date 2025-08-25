// src/components/admin/subscription-modal.tsx
"use client";

import { useState, useEffect } from "react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
}

interface SubscriptionModalProps {
  userId: number;
  userName: string;
  currentSubscription?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubscriptionModal({ 
  userId, 
  userName, 
  currentSubscription, 
  onClose, 
  onSuccess 
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/admin/plans");
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedPlan) {
      alert("Selecione um plano");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId: selectedPlan,
          durationMonths: duration
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert("Erro: " + error.error);
      }
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
      alert("Erro ao criar assinatura");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSubscription = async () => {
    if (!currentSubscription || !confirm("Tem certeza que deseja remover esta assinatura?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions/${currentSubscription.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao remover assinatura");
      }
    } catch (error) {
      console.error("Erro ao remover assinatura:", error);
      alert("Erro ao remover assinatura");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-md w-full p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Gerenciar Assinatura - {userName}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {currentSubscription && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Assinatura Atual</h4>
            <p className="text-gray-300 text-sm">
              Plano: <span className="font-medium">{currentSubscription.plan?.name}</span>
            </p>
            <p className="text-gray-300 text-sm">
              Status: <span className={`font-medium ${
                currentSubscription.status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentSubscription.status}
              </span>
            </p>
            <button
              onClick={handleRemoveSubscription}
              disabled={isLoading}
              className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
            >
              Remover Assinatura
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white">
            {currentSubscription ? "Alterar Assinatura" : "Nova Assinatura"}
          </h4>

          {isLoadingPlans ? (
            <div className="text-center py-4 text-gray-400">Carregando planos...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Plano</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                >
                  <option value="">Selecione um plano</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-gray-800">
                      {plan.name} - R$ {(plan.price / 100).toFixed(2)}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Duração (meses)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={isLoading || !selectedPlan}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded disabled:opacity-50"
                >
                  {isLoading ? "Criando..." : "Criar Assinatura"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}