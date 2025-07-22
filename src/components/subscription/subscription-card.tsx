"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { PLANS, type Subscription, type PlanInfo } from "@/types";
import { Crown, TrendingUp, TrendingDown, X } from "lucide-react";

interface SubscriptionCardProps {
  subscription: Subscription | null;
  onUpgrade: (plan: string) => void;
  onDowngrade: (plan: string) => void;
  onCancel: () => void;
}

export default function SubscriptionCard({ subscription, onUpgrade, onDowngrade, onCancel }: SubscriptionCardProps) {
  const [showPlans, setShowPlans] = useState(false);
  
  const currentPlan = subscription?.plan || "free";
  const currentPlanInfo = PLANS[currentPlan];
  const isActive = subscription?.status === "active";
  const willCancel = subscription?.cancelAtPeriodEnd;

  const planOrder = ["free", "basic", "pro", "enterprise"];
  const currentPlanIndex = planOrder.indexOf(currentPlan);

  const upgradePlans = planOrder
    .slice(currentPlanIndex + 1)
    .map(plan => ({ ...PLANS[plan], key: plan }));
  
  const downgradePlans = planOrder
    .slice(0, currentPlanIndex)
    .map(plan => ({ ...PLANS[plan], key: plan }));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Plano de Assinatura</span>
            <Crown className="w-5 h-5 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plano Atual */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{currentPlanInfo.displayName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPlan === "free" ? "Sem custo" : `R$ ${currentPlanInfo.price}/mês`}
                </p>
              </div>
              {currentPlan !== "free" && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-sm font-medium ${
                    isActive ? "text-green-600" : "text-red-600"
                  }`}>
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              )}
            </div>

            {/* Detalhes da Assinatura */}
            {currentPlan !== "free" && subscription && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Início do período</p>
                  <p className="text-sm font-medium">
                    {formatDate(subscription.currentPeriodStart)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fim do período</p>
                  <p className="text-sm font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            )}

            {willCancel && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Sua assinatura será cancelada em {formatDate(subscription?.currentPeriodEnd || null)}
                </p>
              </div>
            )}
          </div>

          {/* Recursos do Plano Atual */}
          <div>
            <h4 className="text-sm font-medium mb-3">Recursos incluídos:</h4>
            <ul className="space-y-2">
              {currentPlanInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            {/* Botão de Upgrade */}
            {currentPlan !== "enterprise" && (
              <Button
                onClick={() => setShowPlans(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {currentPlan === "free" ? "Assinar um Plano" : "Fazer Upgrade"}
              </Button>
            )}

            {/* Botões de Downgrade e Cancelamento */}
            {currentPlan !== "free" && (
              <div className="flex gap-3">
                {downgradePlans.length > 0 && (
                  <Button
                    onClick={() => setShowPlans(true)}
                    className="flex-1"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Fazer Downgrade
                  </Button>
                )}
                
                {!willCancel ? (
                  <Button
                    onClick={onCancel}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                ) : (
                  <Button
                    onClick={() => console.log("Reativar assinatura")}
                    className="flex-1"
                  >
                    Reativar Assinatura
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Planos */}
      {showPlans && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
                <button
                  onClick={() => setShowPlans(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Planos de Upgrade */}
                {upgradePlans.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-green-600">
                      Planos Superiores
                    </h3>
                    {upgradePlans.map(plan => (
                      <PlanCard
                        key={plan.key}
                        plan={plan}
                        planKey={plan.key}
                        onSelect={() => {
                          onUpgrade(plan.key);
                          setShowPlans(false);
                        }}
                        isUpgrade
                      />
                    ))}
                  </div>
                )}

                {/* Planos de Downgrade */}
                {downgradePlans.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-600">
                      Planos Inferiores
                    </h3>
                    {downgradePlans.map(plan => (
                      <PlanCard
                        key={plan.key}
                        plan={plan}
                        planKey={plan.key}
                        onSelect={() => {
                          onDowngrade(plan.key);
                          setShowPlans(false);
                        }}
                        isUpgrade={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface PlanCardProps {
  plan: PlanInfo & { key: string };
  planKey: string;
  onSelect: () => void;
  isUpgrade: boolean;
}

function PlanCard({ plan, planKey, onSelect, isUpgrade }: PlanCardProps) {
  return (
    <div className={`border-2 rounded-lg p-4 ${
      plan.popular ? "border-purple-500" : "border-gray-200 dark:border-gray-700"
    }`}>
      {plan.popular && (
        <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
          Mais Popular
        </div>
      )}
      
      <h4 className="text-xl font-bold mb-2">{plan.displayName}</h4>
      <p className="text-2xl font-bold mb-4">
        {plan.price === 0 ? "Grátis" : `R$ ${plan.price}/mês`}
      </p>
      
      <ul className="space-y-2 mb-4">
        {plan.features.slice(0, 3).map((feature, index) => (
          <li key={index} className="text-sm flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        className={`w-full ${
          isUpgrade 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-orange-600 hover:bg-orange-700"
        } text-white`}
      >
        {isUpgrade ? "Fazer Upgrade" : "Fazer Downgrade"}
      </Button>
    </div>
  );
}