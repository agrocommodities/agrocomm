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
    fetch("/api/planos")
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
                <div
                  key={plan.id}
                  className="relative bg-white text-black rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <PlanCard />
                  <div className="flex flex-col h-full">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h2>
                      <p>{plan.description || "Plano de assinatura"}</p>
                    </div>
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">R$</span>
                        <span className="text-5xl font-bold ml-1 text-gray-900">{(plan.price / 100).toFixed(0)}</span>
                        <span className="text-gray-600 ml-2">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full bg-indigo-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Assinar Agora
                      </button>
                    </div>
                  </div>
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

// export function Plans() {
//   return (
//     <div className="container px-6 py-8 mx-auto">
//       <div className="sm:flex sm:items-center sm:justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
//             Simple, transparent pricing
//           </h2>
//           <p className="mt-4 text-gray-500 dark:text-gray-400">
//             No Contracts. No surorise fees.
//           </p>
//         </div>

//         <div className="overflow-hidden p-0.5 mt-6 border rounded-lg dark:border-gray-700">
//           <div className="sm:-mx-0.5 flex">
//             <button className=" focus:outline-none px-3 w-1/2 sm:w-auto py-1 sm:mx-0.5 text-white bg-blue-500 rounded-lg">
//               Monthly
//             </button>
//             <button className=" focus:outline-none px-3 w-1/2 sm:w-auto py-1 sm:mx-0.5 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 bg-transparent rounded-lg hover:bg-gray-200">
//               Yearly
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-6 mt-16 -mx-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">


  




//       </div>
//     </div>
//   );
// }
