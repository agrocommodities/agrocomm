"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  Users,
  DollarSign,
  TrendingUp,
  Gift,
  Settings,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  adminGrantPlan,
  adminChangePlan,
  adminCancelSubscription,
  updatePlanAction,
  updateAlertSettingAction,
  type AdminSubscriptionRow,
} from "@/actions/admin-subscriptions";

interface Props {
  subscriptions: AdminSubscriptionRow[];
  plans: Array<{
    id: number;
    slug: string;
    name: string;
    description: string | null;
    priceMonthly: number;
    priceWeekly: number;
    maxClassifieds: number;
    emailBulletins: number;
    priceHistory: number;
    historyDays: number;
    active: number;
    sortOrder: number;
  }>;
  alertSettings: Array<{
    id: number;
    alertType: string;
    enabled: number;
    emailTemplate: string | null;
    daysBefore: number | null;
    daysAfter: number | null;
    maxAttempts: number | null;
    intervalHours: number | null;
  }>;
  stats: {
    activeSubscriptions: number;
    totalRevenue: number;
    newThisMonth: number;
  };
  users: Array<{ id: number; name: string; email: string }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-green-400 bg-green-400/10" },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
  expired: { label: "Expirado", color: "text-yellow-400 bg-yellow-400/10" },
  past_due: { label: "Pendente", color: "text-orange-400 bg-orange-400/10" },
  pending: { label: "Aguardando", color: "text-blue-400 bg-blue-400/10" },
};

const alertTypeLabels: Record<string, string> = {
  card_declined: "Cartão recusado",
  expiring: "Assinatura expirando",
  expired: "Assinatura expirada",
  pix_pending: "Pix pendente",
  boleto_pending: "Boleto pendente",
};

export default function SubscriptionsManager({
  subscriptions: initialSubs,
  plans: initialPlans,
  alertSettings: initialAlerts,
  stats,
  users,
}: Props) {
  const [tab, setTab] = useState<"subs" | "plans" | "alerts">("subs");
  const [subs, setSubs] = useState(initialSubs);
  const [plans, setPlans] = useState(initialPlans);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showGrant, setShowGrant] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Grant form state
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPlanSlug, setGrantPlanSlug] = useState("bronze");
  const [grantUntil, setGrantUntil] = useState("");
  const [grantLifetime, setGrantLifetime] = useState(false);

  function handleGrant() {
    if (!grantUserId) return;
    startTransition(async () => {
      const result = await adminGrantPlan(
        Number(grantUserId),
        grantPlanSlug,
        grantLifetime ? null : grantUntil || null,
      );
      if (result.success) {
        setShowGrant(false);
        window.location.reload();
      }
    });
  }

  function handleChangePlan(subId: number, newSlug: string) {
    startTransition(async () => {
      const result = await adminChangePlan(subId, newSlug);
      if (result.success) {
        setSubs((prev) =>
          prev.map((s) =>
            s.id === subId
              ? {
                  ...s,
                  planSlug: newSlug,
                  planName:
                    plans.find((p) => p.slug === newSlug)?.name ?? s.planName,
                }
              : s,
          ),
        );
      }
    });
  }

  function handleCancel(subId: number) {
    if (!confirm("Cancelar esta assinatura?")) return;
    startTransition(async () => {
      const result = await adminCancelSubscription(subId);
      if (result.success) {
        setSubs((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status: "cancelled" } : s)),
        );
      }
    });
  }

  function handleUpdatePlan(
    planId: number,
    field: string,
    value: number | string,
  ) {
    startTransition(async () => {
      await updatePlanAction(planId, { [field]: value });
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, [field]: value } : p)),
      );
    });
  }

  function handleUpdateAlert(alertId: number, field: string, value: number) {
    startTransition(async () => {
      await updateAlertSettingAction(alertId, { [field]: value });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, [field]: value } : a)),
      );
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assinaturas</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
            <p className="text-xs text-white/50">Assinaturas ativas</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-2xl font-bold">
              R$ {stats.totalRevenue.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-white/50">Receita total</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            <p className="text-xs text-white/50">Novas este mês</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 border border-white/10">
        {[
          { id: "subs" as const, label: "Assinaturas", icon: CreditCard },
          { id: "plans" as const, label: "Planos", icon: Settings },
          { id: "alerts" as const, label: "Alertas", icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === id
                ? "bg-green-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content: Subscriptions */}
      {tab === "subs" && (
        <div>
          {/* Grant button */}
          <button
            type="button"
            onClick={() => setShowGrant(!showGrant)}
            className="mb-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            Conceder plano
            {showGrant ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Grant form */}
          {showGrant && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
              <div>
                <label className="text-xs text-white/50 block mb-1">
                  Usuário
                  <select
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">
                  Plano
                  <select
                    value={grantPlanSlug}
                    onChange={(e) => setGrantPlanSlug(e.target.value)}
                    className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                  >
                    {plans.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={grantLifetime}
                    onChange={(e) => setGrantLifetime(e.target.checked)}
                    className="accent-green-500"
                  />
                  Vitalício
                </label>
                {!grantLifetime && (
                  <input
                    type="date"
                    value={grantUntil}
                    onChange={(e) => setGrantUntil(e.target.value)}
                    className="bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleGrant}
                disabled={isPending || !grantUserId}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Concedendo…" : "Conceder"}
              </button>
            </div>
          )}

          {/* Subscriptions table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="pb-2 font-medium">Usuário</th>
                  <th className="pb-2 font-medium">Plano</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Período</th>
                  <th className="pb-2 font-medium">Vencimento</th>
                  <th className="pb-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => {
                  const s = statusLabels[sub.status] ?? statusLabels.pending;
                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-3">
                        <div className="font-medium">{sub.userName}</div>
                        <div className="text-xs text-white/40">
                          {sub.userEmail}
                        </div>
                      </td>
                      <td className="py-3">
                        <select
                          value={sub.planSlug}
                          onChange={(e) =>
                            handleChangePlan(sub.id, e.target.value)
                          }
                          className="bg-[#2a3925] border border-white/10 rounded px-2 py-1 text-xs"
                        >
                          {plans.map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}
                        >
                          {s.label}
                        </span>
                        {sub.grantedByAdmin ? (
                          <span className="ml-1 text-xs text-yellow-400">
                            (admin)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-white/60 text-xs">
                        {sub.grantedByAdmin
                          ? sub.grantedUntil
                            ? `Até ${new Date(sub.grantedUntil).toLocaleDateString("pt-BR")}`
                            : "Vitalício"
                          : sub.period === "weekly"
                            ? "Semanal"
                            : "Mensal"}
                      </td>
                      <td className="py-3 text-white/60 text-xs">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString(
                              "pt-BR",
                            )
                          : "—"}
                      </td>
                      <td className="py-3">
                        {sub.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(sub.id)}
                            disabled={isPending}
                            className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/40">
                      Nenhuma assinatura encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content: Plans */}
      {tab === "plans" && (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <h3 className="font-bold text-lg mb-3">{plan.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Preço mensal (R$)
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={plan.priceMonthly}
                      onBlur={(e) =>
                        handleUpdatePlan(
                          plan.id,
                          "priceMonthly",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Preço semanal (R$)
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={plan.priceWeekly}
                      onBlur={(e) =>
                        handleUpdatePlan(
                          plan.id,
                          "priceWeekly",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Max anúncios
                    <input
                      type="number"
                      defaultValue={plan.maxClassifieds}
                      onBlur={(e) =>
                        handleUpdatePlan(
                          plan.id,
                          "maxClassifieds",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Dias de histórico
                    <input
                      type="number"
                      defaultValue={plan.historyDays}
                      onBlur={(e) =>
                        handleUpdatePlan(
                          plan.id,
                          "historyDays",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={plan.emailBulletins === 1}
                    onChange={(e) =>
                      handleUpdatePlan(
                        plan.id,
                        "emailBulletins",
                        e.target.checked ? 1 : 0,
                      )
                    }
                    className="accent-green-500"
                  />
                  Boletins e-mail
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={plan.priceHistory === 1}
                    onChange={(e) =>
                      handleUpdatePlan(
                        plan.id,
                        "priceHistory",
                        e.target.checked ? 1 : 0,
                      )
                    }
                    className="accent-green-500"
                  />
                  Histórico de preços
                </label>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={plan.active === 1}
                    onChange={(e) =>
                      handleUpdatePlan(
                        plan.id,
                        "active",
                        e.target.checked ? 1 : 0,
                      )
                    }
                    className="accent-green-500"
                  />
                  Ativo
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content: Alerts */}
      {tab === "alerts" && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">
                  {alertTypeLabels[alert.alertType] ?? alert.alertType}
                </h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={alert.enabled === 1}
                    onChange={(e) =>
                      handleUpdateAlert(
                        alert.id,
                        "enabled",
                        e.target.checked ? 1 : 0,
                      )
                    }
                    className="accent-green-500"
                  />
                  Ativo
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Dias antes
                    <input
                      type="number"
                      defaultValue={alert.daysBefore ?? 0}
                      onBlur={(e) =>
                        handleUpdateAlert(
                          alert.id,
                          "daysBefore",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Dias depois
                    <input
                      type="number"
                      defaultValue={alert.daysAfter ?? 0}
                      onBlur={(e) =>
                        handleUpdateAlert(
                          alert.id,
                          "daysAfter",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Max tentativas
                    <input
                      type="number"
                      defaultValue={alert.maxAttempts ?? 3}
                      onBlur={(e) =>
                        handleUpdateAlert(
                          alert.id,
                          "maxAttempts",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">
                    Intervalo (horas)
                    <input
                      type="number"
                      defaultValue={alert.intervalHours ?? 24}
                      onBlur={(e) =>
                        handleUpdateAlert(
                          alert.id,
                          "intervalHours",
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-[#2a3925] border border-white/10 rounded-lg px-3 py-2 text-sm mt-1"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
