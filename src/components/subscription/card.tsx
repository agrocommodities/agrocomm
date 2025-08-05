"use client";

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
  const isPopular = plan.name.toLowerCase().includes('popular') || plan.name.toLowerCase().includes('pro');

  return (
    <div className={`px-6 py-4 transition-colors duration-200 transform rounded-lg border-2 ${
      isPopular 
        ? 'bg-black/70 border-white/30 shadow-lg' 
        : 'bg-black/50 border-black/50 hover:bg-black/60'
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="mx-4 text-gray-300">
            Acesso às cotações em tempo real
          </span>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="mx-4 text-gray-300">
            Histórico de preços completo
          </span>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="mx-4 text-gray-300">
            Alertas personalizados
          </span>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="mx-4 text-gray-300">
            Análise de tendências
          </span>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="mx-4 text-gray-300">
            Suporte prioritário
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}