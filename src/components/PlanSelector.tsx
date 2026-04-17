"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Crown,
  Mail,
  BarChart3,
  ShoppingBag,
  Check,
  Sparkles,
} from "lucide-react";
import type { PlanRow, UserSubscription } from "@/actions/subscriptions";

interface PlanSelectorProps {
  plans: PlanRow[];
  currentSubscription: UserSubscription | null;
}

const planIcons: Record<string, typeof Crown> = {
  bronze: Sparkles,
  prata: Crown,
  ouro: Crown,
};

const planColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  prata: "from-gray-400 to-gray-600",
  ouro: "from-yellow-400 to-yellow-600",
};

const planBorders: Record<string, string> = {
  bronze: "border-amber-700/40",
  prata: "border-gray-400/40",
  ouro: "border-yellow-400/40 ring-1 ring-yellow-400/20",
};

export default function PlanSelector({
  plans,
  currentSubscription,
}: PlanSelectorProps) {
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");

  return (
    <div>
      {/* Period toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/5 rounded-xl p-1 flex gap-1 border border-white/10">
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              period === "monthly"
                ? "bg-green-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              period === "weekly"
                ? "bg-green-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.slug] ?? Sparkles;
          const isCurrent =
            currentSubscription?.planSlug === plan.slug &&
            currentSubscription.status === "active";
          const isUpgrade =
            currentSubscription &&
            currentSubscription.status === "active" &&
            plan.sortOrder >
              (plans.find((p) => p.slug === currentSubscription.planSlug)
                ?.sortOrder ?? 0);
          const isDowngrade =
            currentSubscription &&
            currentSubscription.status === "active" &&
            plan.sortOrder <
              (plans.find((p) => p.slug === currentSubscription.planSlug)
                ?.sortOrder ?? 0);

          const price =
            period === "monthly" ? plan.priceMonthly : plan.priceWeekly;

          return (
            <div
              key={plan.id}
              className={`relative bg-white/5 rounded-2xl border ${
                planBorders[plan.slug] ?? "border-white/10"
              } p-6 flex flex-col transition-transform hover:scale-[1.02]`}
            >
              {/* Badge */}
              {plan.slug === "ouro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div
                  className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${
                    planColors[plan.slug] ?? "from-green-500 to-green-700"
                  } flex items-center justify-center mb-3`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-white/50 mt-1">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-white/50">R$</span>
                  <span className="text-4xl font-extrabold">
                    {price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  /{period === "monthly" ? "mês" : "semana"}
                </p>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white/70">Boletins por e-mail</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white/70">
                    Histórico de {plan.historyDays} dias
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white/70">
                    {plan.maxClassifieds >= 999
                      ? "Anúncios ilimitados"
                      : `${plan.maxClassifieds} anúncios`}
                  </span>
                </li>
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center py-3 rounded-xl bg-green-600/20 text-green-400 text-sm font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Plano atual
                </div>
              ) : (
                <Link
                  href={`/planos/checkout/${plan.slug}?period=${period}`}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.slug === "ouro"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500"
                      : "bg-green-600 text-white hover:bg-green-500"
                  }`}
                >
                  {isUpgrade
                    ? "Upgrade"
                    : isDowngrade
                      ? "Downgrade"
                      : "Assinar"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
