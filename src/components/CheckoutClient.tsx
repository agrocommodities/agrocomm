"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  QrCode,
} from "lucide-react";
import PaymentBrick from "@/components/PaymentBrick";
import type { PlanRow } from "@/actions/subscriptions";

interface CheckoutClientProps {
  plan: PlanRow;
  period: "monthly" | "weekly";
  isModal?: boolean;
}

type PaymentResult = {
  status: string;
  paymentId: number | string;
  pixQrCode?: string | null;
  pixQrCodeBase64?: string | null;
  boletoUrl?: string | null;
};

export default function CheckoutClient({
  plan,
  period,
  isModal,
}: CheckoutClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amount = period === "monthly" ? plan.priceMonthly : plan.priceWeekly;

  const handleSuccess = useCallback((data: PaymentResult) => {
    setResult(data);
    setError(null);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  // Success state
  if (result) {
    if (result.status === "approved") {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pagamento aprovado!</h2>
          <p className="text-white/60 mb-6">
            Sua assinatura do plano {plan.name} está ativa.
          </p>
          <button
            type="button"
            onClick={() => router.push("/ajustes")}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500 transition-colors cursor-pointer"
          >
            Ir para ajustes
          </button>
        </div>
      );
    }

    if (result.status === "pending") {
      return (
        <div className="py-6">
          <div className="text-center mb-6">
            <Clock className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
            <h2 className="text-xl font-bold mb-1">Pagamento pendente</h2>
            <p className="text-sm text-white/60">
              Complete o pagamento para ativar sua assinatura.
            </p>
          </div>

          {result.pixQrCodeBase64 && (
            <div className="bg-white rounded-xl p-6 mx-auto max-w-xs mb-4">
              {/* biome-ignore lint/performance/noImgElement: dynamic base64 image cannot use next/image */}
              <img
                src={`data:image/png;base64,${result.pixQrCodeBase64}`}
                alt="QR Code Pix"
                className="w-full"
              />
            </div>
          )}

          {result.pixQrCode && (
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-1">
                <QrCode className="w-3 h-3 inline mr-1" />
                Código Pix (copie e cole)
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs break-all text-white/70 select-all">
                {result.pixQrCode}
              </div>
            </div>
          )}

          {result.boletoUrl && (
            <a
              href={result.boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500 transition-colors"
            >
              Abrir boleto
            </a>
          )}
        </div>
      );
    }

    // Rejected
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pagamento recusado</h2>
        <p className="text-white/60 mb-6">
          Tente novamente ou use outro método de pagamento.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500 transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      {!isModal && (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos planos
        </button>
      )}

      {/* Plan summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Plano {plan.name}</h3>
            <p className="text-sm text-white/50">
              {period === "monthly" ? "Mensal" : "Semanal"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">
              R$ {amount.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-white/40">
              /{period === "monthly" ? "mês" : "semana"}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Payment Brick */}
      <PaymentBrick
        amount={amount}
        planSlug={plan.slug}
        period={period}
        onPaymentSuccess={handleSuccess}
        onPaymentError={handleError}
      />
    </div>
  );
}
