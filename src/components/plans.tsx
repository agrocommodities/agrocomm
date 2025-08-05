"use client";

import { useState, useEffect } from "react";
import { PaymentModal } from "@/components/subscription/modal";
import { PlanCard } from "@/components/subscription/card";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  price_id: string;
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plans")
      .then(res => res.json())
      .then(data => {
        data.reverse();
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar planos:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Pequeno delay para limpar o plano selecionado após a animação
    setTimeout(() => setSelectedPlan(null), 300);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-4">Carregando planos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-6 py-8 mx-auto">
        {plans.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-gray-400">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                  Escolha seu Plano
                </h2>
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Selecione o plano que melhor atende às suas necessidades.
                </p>
              </div>
              <div className="overflow-hidden p-0.5 mt-6 border rounded-lg dark:border-gray-700">
                <div className="sm:-mx-0.5 flex">
                  <button className=" focus:outline-none px-3 w-1/2 sm:w-auto py-1 sm:mx-0.5 text-white bg-blue-500 rounded-lg">
                    Mensal
                  </button>
                  <button className=" focus:outline-none px-3 w-1/2 sm:w-auto py-1 sm:mx-0.5 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 bg-transparent rounded-lg hover:bg-gray-200">
                    Anual
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-6 mt-16 -mx-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plans.map(plan => (              
                <PlanCard key={plan.id}>
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full px-4 py-2 mt-10 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                    Assinar
                  </button>
                </PlanCard>
              ))}
            </div>
          </>
        )}
        {selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}      
    </div>
  );
}