"use client";

import { Icon } from "@/components/subscription/icon";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  price_id: string;
}

interface PlanCardProps {
  children: React.ReactNode;
  plan: Plan;
  formatPrice: (price: number, interval: string) => string;
}

export function PlanCard({ children, plan, formatPrice }: PlanCardProps) {
  const isPopular = plan.name.toLowerCase().includes('popular') || plan.name.toLowerCase().includes('premium');

  return (
    <div className={`px-4 md:px-6 py-3 transition-colors duration-200 transform rounded-lg border-2 ${
      isPopular 
        ? 'bg-black/20 border-black/30 shadow-lg' 
        : 'bg-black/20 border-black/30 hover:bg-black/50'
    }`}>
      {isPopular && (
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
            Mais Popular
          </span>
        </div>
      )}
      
      <p className="text-lg font-medium text-white">
        {plan.name}
      </p>
      <h4 className="mt-2 text-4xl font-semibold text-white">
        {formatPrice(plan.price, plan.interval)}
      </h4>
      <p className="mt-4 text-gray-300">
        {plan.description || 'Acesso completo às funcionalidades da plataforma'}
      </p>

      <div className="mt-8 space-y-4">
        
        <div className="flex items-center">
          {plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('empresarial') ?
            <Icon icon="check" />
          :
            <Icon icon="x" />
          }
          <span className="mx-4 text-gray-300">
            Cotações em tempo real
          </span>
        </div>

        <div className="flex items-center">
          {plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('empresarial') ?
            <Icon icon="check" />
          :
            <Icon icon="x" />
          }
          <span className="mx-4 text-gray-300">
            Histórico de preços completo
          </span>
        </div>

        <div className="flex items-center">
          {plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('empresarial') ?
            <Icon icon="check" />
          :
            <Icon icon="x" />
          }
          <span className="mx-4 text-gray-300">
            Alertas personalizados
          </span>
        </div>

        <div className="flex items-center">
          {plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('empresarial') ?
            <Icon icon="check" />
          :
            <Icon icon="x" />
          }
          <span className="mx-4 text-gray-300">
            Análise de tendências
          </span>
        </div>

        <div className="flex items-center">
          {plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('empresarial') ?
            <Icon icon="check" />
          :
            <Icon icon="x" />
          }
          <span className="mx-4 text-gray-300">
            Suporte prioritário
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}