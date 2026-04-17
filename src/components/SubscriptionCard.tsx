import Link from "next/link";
import { Crown, Sparkles, Calendar, ArrowRight, XCircle } from "lucide-react";
import type { UserSubscription } from "@/actions/subscriptions";

interface SubscriptionCardProps {
  subscription: UserSubscription | null;
}

const planIcons: Record<string, typeof Crown> = {
  bronze: Sparkles,
  prata: Crown,
  ouro: Crown,
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-green-400 bg-green-400/10" },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
  expired: { label: "Expirado", color: "text-yellow-400 bg-yellow-400/10" },
  past_due: {
    label: "Pagamento pendente",
    color: "text-orange-400 bg-orange-400/10",
  },
  pending: { label: "Pendente", color: "text-blue-400 bg-blue-400/10" },
};

export default function SubscriptionCard({
  subscription,
}: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-center">
          <Crown className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <h3 className="font-semibold text-white/80 mb-1">Sem plano ativo</h3>
          <p className="text-sm text-white/40 mb-4">
            Assine um plano para acessar recursos exclusivos
          </p>
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-500 transition-colors"
          >
            Ver planos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const Icon = planIcons[subscription.planSlug] ?? Sparkles;
  const status = statusLabels[subscription.status] ?? statusLabels.pending;

  const periodEnd = subscription.grantedByAdmin
    ? subscription.grantedUntil
    : subscription.currentPeriodEnd;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Plano {subscription.planName}</h3>
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {subscription.grantedByAdmin ? (
        <p className="text-sm text-white/50 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          {subscription.grantedUntil
            ? `Concedido pelo admin até ${new Date(subscription.grantedUntil).toLocaleDateString("pt-BR")}`
            : "Concedido pelo admin — vitalício"}
        </p>
      ) : periodEnd ? (
        <p className="text-sm text-white/50 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {subscription.status === "active"
            ? `Renova em ${new Date(periodEnd).toLocaleDateString("pt-BR")}`
            : `Expirou em ${new Date(periodEnd).toLocaleDateString("pt-BR")}`}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {subscription.status === "active" && (
          <>
            <Link
              href="/planos"
              className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
            >
              Alterar plano
            </Link>
            <span className="text-white/20">•</span>
          </>
        )}
        {subscription.status === "active" && !subscription.grantedByAdmin && (
          <CancelButton subscriptionId={subscription.id} />
        )}
        {subscription.status !== "active" && (
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
          >
            Renovar assinatura
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function CancelButton({
  subscriptionId: _subscriptionId,
}: {
  subscriptionId: number;
}) {
  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;

    const { cancelSubscription } = await import("@/actions/subscriptions");
    const result = await cancelSubscription();
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || "Erro ao cancelar");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
    >
      <XCircle className="w-3 h-3" />
      Cancelar assinatura
    </button>
  );
}
