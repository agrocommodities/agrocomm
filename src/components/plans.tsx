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
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    fetch("/api/plans")
      .then(res => res.json())
      .then(data => {
        data.reverse();
        setAllPlans(data);
        // Filtrar planos mensais por padrão
        const monthlyPlans = data.filter((plan: Plan) => plan.interval === 'month');
        setFilteredPlans(monthlyPlans);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar planos:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filtrar planos baseado no intervalo selecionado
    const filtered = allPlans.filter(plan => plan.interval === billingInterval);
    setFilteredPlans(filtered);
  }, [billingInterval, allPlans]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPlan(null), 300);
  };

  const handleBillingChange = (interval: 'month' | 'year') => {
    setBillingInterval(interval);
  };

  const formatPrice = (price: number, interval: string) => {
    const formattedPrice = (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return `${formattedPrice}/${interval === 'month' ? 'mês' : 'ano'}`;
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
    <div className="w-full px-6 py-8">
      {allPlans.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600 dark:text-gray-400">Nenhum plano disponível no momento.</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Escolha seu Plano
            </h2>
            <p className="text-gray-300 mb-8">
              Selecione o plano que melhor atende às suas necessidades.
            </p>
            <div className="inline-flex overflow-hidden p-0.5 border-2 border-black/50 rounded-lg bg-black/20">
              <button 
                onClick={() => handleBillingChange('month')}
                className={`focus:outline-none px-4 py-2 rounded-lg transition-colors font-medium ${
                  billingInterval === 'month'
                    ? 'text-white bg-black/60 border-2 border-black/80'
                    : 'text-gray-300 hover:text-white hover:bg-black/30'
                }`}
              >
                Mensal
              </button>
              <button 
                onClick={() => handleBillingChange('year')}
                className={`focus:outline-none px-4 py-2 rounded-lg transition-colors font-medium ${
                  billingInterval === 'year'
                    ? 'text-white bg-black/60 border-2 border-black/80'
                    : 'text-gray-300 hover:text-white hover:bg-black/30'
                }`}
              >
                Anual
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
            {filteredPlans.map(plan => (              
              <div key={plan.id} className="w-full sm:w-80 flex-shrink-0">
                <PlanCard plan={plan} formatPrice={formatPrice}>
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full px-4 py-2 mt-10 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-black/60 border-2 border-black/80 rounded-md hover:bg-black/75 focus:outline-none focus:bg-black/75">
                    Assinar
                  </button>
                </PlanCard>
              </div>
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