// src/app/(stripe)/assinaturas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { Check, Crown, Rocket, Building } from "lucide-react";
import Button from "@/components/ui/button";
import { createCheckoutSession } from "@/actions/stripe";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  price_id: string;
  interval: string;
  features?: string[];
}

const iconMap = {
  "Plano Básico": Crown,
  "Plano Profissional": Rocket,
  "Plano Empresarial": Building,
};

export default function AssinaturasPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchPlans();
  }, []);

  const checkAuthAndFetchPlans = async () => {
    try {
      // Verificar se usuário está autenticado
      const response = await fetch("/api/auth/check");
      const { authenticated, emailVerified } = await response.json();

      if (!authenticated) {
        router.push("/verificar-assinatura");
        return;
      }

      if (!emailVerified) {
        router.push("/confirmar-email");
        return;
      }

      // Buscar planos do Stripe
      fetchPlans();
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.push("/verificar-assinatura");
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();
      
      // Adicionar features hardcoded (você pode buscar do Stripe metadata)
      const plansWithFeatures = data.map((plan: Plan) => ({
        ...plan,
        features: getPlanFeatures(plan.name),
      }));
      
      setPlans(plansWithFeatures);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (planName: string): string[] => {
    const features: Record<string, string[]> = {
      "Plano Básico - AgroComm": [
        "Acesso completo às cotações",
        "Histórico de 30 dias",
        "10 alertas de preço",
        "Relatórios mensais",
        "Suporte por email",
      ],
      "Plano Profissional - AgroComm": [
        "Tudo do plano Básico",
        "Histórico ilimitado",
        "Alertas ilimitados",
        "API de integração",
        "Análises avançadas",
        "Suporte prioritário",
      ],
      "Plano Empresarial - AgroComm": [
        "Tudo do plano Profissional",
        "Múltiplos usuários",
        "Relatórios personalizados",
        "Consultoria dedicada",
        "SLA garantido",
        "Treinamento incluído",
      ],
    };

    return features[planName] || [];
  };

  const handleSelectPlan = async (priceId: string, planName: string) => {
    setSelectedPlan(priceId);
    
    try {
      const result = await createCheckoutSession(planName.toLowerCase().includes("básico") ? "basic" : 
                                                 planName.toLowerCase().includes("profissional") ? "pro" : "enterprise");
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      alert("Erro ao processar assinatura");
    } finally {
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Escolha seu plano AgroComm
          </h1>
          <p className="text-xl text-gray-400">
            Acesse as melhores cotações do mercado agropecuário
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const iconKey = plan.name.split(" - ")[0] as keyof typeof iconMap;
            const Icon = iconMap[iconKey] || Crown;
            const isPopular = plan.name.includes("Profissional");
            
            return (
              <div
                key={plan.id}
                className={`relative bg-black/50 border-2 rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  isPopular
                    ? "border-primary-500 shadow-2xl shadow-primary-500/20"
                    : "border-black/40"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                {/* Plan Icon */}
                <div className="flex justify-center mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isPopular ? "bg-primary-500" : "bg-gray-700"
                  }`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Plan Name */}
                <h2 className="text-2xl font-bold text-center mb-2">
                  {plan.name.split(" - ")[0]}
                </h2>

                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">
                    R$ {(plan.price / 100).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-gray-400">/{plan.interval === "month" ? "mês" : "ano"}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.price_id, plan.name)}
                  disabled={selectedPlan === plan.price_id}
                  className={`w-full py-3 font-semibold transition-all ${
                    isPopular
                      ? "bg-primary-500 hover:bg-primary-600 text-white"
                      : "bg-transparent border-2 border-gray-600 hover:border-white"
                  }`}
                >
                  {selectedPlan === plan.price_id ? "Processando..." : "Assinar Agora"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400">
            Todos os planos incluem garantia de 7 dias.{" "}
            <a href="#" className="text-primary-500 hover:underline">
              Termos e condições
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}