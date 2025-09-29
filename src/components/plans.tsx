"use client";

import { useState, useEffect, useId } from "react";
import { PaymentModal } from "@/components/subscription/modal";
import { PlanCard } from "@/components/subscription/card";
import type { User, StripeSubscription } from "@/types";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  price_id: string;
}

// Palavras-chave para filtrar planos indesejados
const EXCLUDED_KEYWORDS = [
  'light', 'demo', 'development', 'dev', 'staging', 
  'sandbox', 'trial', 'example', 'sample', 'old', 'antigo',
  'descontinuado', 'discontinued', 'hidden', 'oculto'
];

function shouldExcludePlan(planName: string): boolean {
  const lowerName = planName.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

export function Plans() {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  // const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<StripeSubscription | undefined>(undefined); // Usar undefined
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMacBookAir, setIsMacBookAir] = useState(false);

  // Detectar MacBook Air 13" especificamente
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // MacBook Air 13" tem 1440x900 na resolução padrão
      setIsMacBookAir(width === 1440 || (width >= 1280 && width <= 1440));
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // Verificar usuário e assinatura
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const result = await fetch('/api/user/subscription-status');
        if (result.ok) {
          const data = await result.json();
          setUser(data.user);
          setSubscription(data.subscription);
          setIsSubscribed(data.isSubscribed);
        }
      } catch (error) {
        console.error("Erro ao verificar status do usuário:", error);
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!stripePublishableKey || stripePublishableKey.trim() === '') {
      setStripeConfigured(false);
      setLoading(false);
      return;
    }

    setStripeConfigured(true);

    fetch("/api/plans")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setStripeConfigured(false);
          return;
        }
        
        // Filtrar planos com palavras-chave indesejadas
        const validPlans = data.filter(plan => !shouldExcludePlan(plan.name));
        
        validPlans.reverse();
        setAllPlans(validPlans);
        
        const monthlyPlans = validPlans.filter((plan: Plan) => plan.interval === 'month');
        setFilteredPlans(monthlyPlans);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar planos:", err);
        setStripeConfigured(false);
        setLoading(false);
      });
  }, []);

  // Removido: lógica de filtragem por billingInterval, pois não há UI para alterar o intervalo

  const handleSelectPlan = (plan: Plan) => {
    // Se não estiver logado, redirecionar para login
    if (!user) {
      const loginUrl = `/entrar?redirect=${encodeURIComponent('/#planos')}`;
      window.location.href = loginUrl;
      return;
    }

    // Se já for assinante, mostrar opções diferentes
    if (isSubscribed && subscription) {
      // Lógica para determinar se é upgrade, downgrade ou cancelamento
      const currentPlanPrice = subscription.items.data[0].price.unit_amount;
      const selectedPlanPrice = plan.price;

      if (subscription.items.data[0].price.id === plan.price_id) {
        // Mesmo plano - opção de cancelar
        handleCancelSubscription();
        return;
      } else if (selectedPlanPrice > currentPlanPrice) {
        // Upgrade
        handleUpgrade(plan);
        return;
      } else {
        // Downgrade
        handleDowngrade(plan);
        return;
      }
    }

    // Usuário logado mas sem assinatura - processo normal
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCancelSubscription = () => {
    if (confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      window.location.href = '/ajustes#assinatura';
    }
  };

  const handleUpgrade = (plan: Plan) => {
    if (confirm(`Fazer upgrade para ${plan.name}?`)) {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    }
  };

  const handleDowngrade = (plan: Plan) => {
    if (confirm(`Fazer downgrade para ${plan.name}?`)) {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPlan(null), 300);
  };

  const getButtonText = (plan: Plan): string => {
    if (!user) return "Assinar";
    
    if (isSubscribed && subscription) {
      const currentPlanId = subscription.items.data[0].price.id;
      const currentPlanPrice = subscription.items.data[0].price.unit_amount;
      const selectedPlanPrice = plan.price;

      if (currentPlanId === plan.price_id) {
        return "Cancelar";
      } else if (selectedPlanPrice > currentPlanPrice) {
        return "Upgrade";
      } else {
        return "Downgrade";
      }
    }
    
    return "Assinar";
  };

  const getButtonStyle = (plan: Plan): string => {
    if (!user) return "bg-black/60 border-2 border-black/80 hover:bg-black/75";
    
    if (isSubscribed && subscription) {
      const currentPlanId = subscription.items.data[0].price.id;
      const currentPlanPrice = subscription.items.data[0].price.unit_amount;
      const selectedPlanPrice = plan.price;

      if (currentPlanId === plan.price_id) {
        return "bg-red-600/60 border-2 border-red-600/80 hover:bg-red-600/75";
      } else if (selectedPlanPrice > currentPlanPrice) {
        return "bg-green-600/60 border-2 border-green-600/80 hover:bg-green-600/75";
      } else {
        return "bg-orange-600/60 border-2 border-orange-600/80 hover:bg-orange-600/75";
      }
    }
    
    return "bg-black/60 border-2 border-black/80 hover:bg-black/75";
  };

  const formatPrice = (price: number, interval: string) => {
    const formattedPrice = (price / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return `${formattedPrice}/${interval === 'month' ? 'mês' : 'ano'}`;
  };

  const planosId = useId();

  if (!stripeConfigured) {
    return null;
  }

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
    <div className="w-full px-6 py-8" id={planosId}>
      {filteredPlans.length > 0 && (
        <>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Escolha seu Plano
            </h2>
            <p className="text-gray-300 mb-4">
              Selecione o plano que melhor atende às suas necessidades.
            </p>
            {isSubscribed && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg max-w-md mx-auto">
                <p className="text-green-300 text-sm">
                  ✅ Você já é um assinante ativo!
                </p>
              </div>
            )}
          </div>
          
          {/* Grid responsivo otimizado especialmente para MacBook Air 13" */}
          <div className={`
            grid max-w-7xl mx-auto
            ${isMacBookAir 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 plans-grid-macbook' 
              : `gap-4 lg:gap-6 plans-grid-desktop ${
                filteredPlans.length === 1 ? 'grid-cols-1 justify-center' :
                filteredPlans.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                filteredPlans.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`
            }
          `}
          data-plan-count={filteredPlans.length}>
            {filteredPlans.map(plan => (              
              <div key={plan.id} className={`w-full mx-auto ${isMacBookAir ? 'max-w-xs' : 'max-w-sm'}`}>
                <PlanCard plan={plan} formatPrice={formatPrice}>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`
                      w-full px-4 py-2 mt-6 lg:mt-10 font-medium 
                      tracking-wide text-white capitalize 
                      transition-colors duration-200 transform 
                      rounded-md focus:outline-none focus:ring-2 focus:ring-white/50
                      cursor-pointer
                      ${getButtonStyle(plan)}
                    `}
                  >
                    {getButtonText(plan)}
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