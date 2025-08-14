// src/components/auth/subscription-manager.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { User, StripeSubscription, Subscription } from "@/types";

export function SubscriptionManager({
  user,
  isSubscribed,
  subscription,
  localSubscription, // Adicionar esta prop
}: {
  user: User;
  isSubscribed: boolean;
  subscription?: StripeSubscription;
  localSubscription?: Subscription; // Adicionar este tipo
}) {
  const [loading, setLoading] = useState(false);

  const formatDate = (timestamp: number | string) => {
    try {
      let dateValue: number;

      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return "Data não disponível";
        }
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      } else {
        dateValue = timestamp;
      }

      if (!dateValue || isNaN(dateValue) || dateValue <= 0) {
        return "Data não disponível";
      }

      const date = new Date(dateValue * 1000);
      if (isNaN(date.getTime())) {
        return "Data não disponível";
      }

      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };

  // CORREÇÃO: Melhorar formatação de datas
  // const formatDate = (timestamp: number | string) => {
  //   try {
  //     let dateValue: number;

  //     // Se for string ISO, converter para timestamp
  //     if (typeof timestamp === "string") {
  //       const date = new Date(timestamp);
  //       if (isNaN(date.getTime())) {
  //         return "Data não disponível";
  //       }
  //       dateValue = Math.floor(date.getTime() / 1000); // Converter para segundos
  //     } else {
  //       dateValue = timestamp;
  //     }

  //     // Verificar se é um timestamp válido
  //     if (!dateValue || isNaN(dateValue) || dateValue <= 0) {
  //       return "Data não disponível";
  //     }

  //     // Stripe usa timestamps em segundos, JavaScript usa milissegundos
  //     const date = new Date(dateValue * 1000);

  //     // Verificar se a data é válida
  //     if (isNaN(date.getTime())) {
  //       return "Data não disponível";
  //     }

  //     return date.toLocaleDateString("pt-BR", {
  //       day: "2-digit",
  //       month: "long",
  //       year: "numeric",
  //     });
  //   } catch (error) {
  //     console.error("Erro ao formatar data:", error);
  //     return "Data não disponível";
  //   }
  // };

  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCancelSubscription = async () => {
    if (
      !subscription ||
      !confirm(
        "Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (response.ok) {
        alert("Assinatura cancelada com sucesso.");
        window.location.reload();
      } else {
        throw new Error("Erro ao cancelar assinatura");
      }
    } catch (error) {
      alert("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const response = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error("Erro ao renovar assinatura");
      }
    } catch (error) {
      alert("Erro ao renovar assinatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSubscribed || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma assinatura ativa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Assine um plano para acessar recursos premium e histórico completo
              de cotações.
            </p>
            <Link
              href="/#planos"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ver Planos Disponíveis
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = subscription.items.data[0];
  const planName = currentPlan.price.product.name || "Plano Premium";
  const planAmount = currentPlan.price.unit_amount;
  const planInterval = currentPlan.price.recurring.interval;

  return (
    <Card id="assinatura">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Assinatura Ativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Assinatura */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">
                {planName}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {formatPrice(planAmount)} por{" "}
                {planInterval === "month" ? "mês" : "ano"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Assinatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Histórico da Assinatura
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Primeira assinatura:
                </span>
                <span className="font-medium">
                  {formatDate(subscription.created)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Plano atual desde:
                </span>
                <span className="font-medium">
                  {formatDate(subscription.current_period_start)}
                </span>
              </div>

              {subscription.start_date !== subscription.created && (
                <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  Upgrade realizado
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Informações de Pagamento
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Último pagamento:
                </span>
                <span className="font-medium">
                  {formatDate(subscription.current_period_start)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Próximo pagamento:
                </span>
                <span className="font-medium">
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Status do pagamento:
                </span>
                <span className="font-medium text-green-600">
                  {subscription.status === "active"
                    ? "Em dia"
                    : subscription.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Ações da Assinatura
          </h4>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRenewSubscription}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Processando..." : "Renovar Antecipadamente"}
            </Button>

            <Link
              href="/#planos"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Alterar Plano
            </Link>

            <Button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Processando..." : "Cancelar Assinatura"}
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            * O cancelamento será efetivo no final do período atual (
            {formatDate(subscription.current_period_end)})
          </p>
        </div>

        {/* Benefícios da Assinatura */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Benefícios Inclusos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Histórico completo de cotações
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Gráficos avançados
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Alertas personalizados
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Suporte prioritário
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
