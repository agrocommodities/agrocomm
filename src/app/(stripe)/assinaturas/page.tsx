"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Rocket, Building } from "lucide-react";
import Button from "@/components/ui/button";
import { createCheckoutSession } from "@/actions/stripe";
import PaymentButton from "@/components/stripe/payment-button";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isOpen);
    if (!isOpen) {
      document.documentElement.style.overflow = "auto";
    } else {
      document.documentElement.style.overflow = "hidden";
    }
  }, [isOpen]);


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
        {/* Botão para abrir o modal */}
          <PaymentButton />
        </div>
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
  );
}