"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: Record<string, unknown>,
    ) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  bricks: () => {
    create: (
      brick: string,
      containerId: string,
      settings: Record<string, unknown>,
    ) => Promise<unknown>;
  };
}

interface PaymentBrickProps {
  amount: number;
  planSlug: string;
  period: "monthly" | "weekly";
  onPaymentSuccess: (data: {
    status: string;
    paymentId: number | string;
    pixQrCode?: string | null;
    pixQrCodeBase64?: string | null;
    boletoUrl?: string | null;
  }) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentBrick({
  amount,
  planSlug,
  period,
  onPaymentSuccess,
  onPaymentError,
}: PaymentBrickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      onPaymentError("Chave pública do Mercado Pago não configurada");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => {
      if (!window.MercadoPago) return;

      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      bricksBuilder
        .create("payment", "paymentBrick_container", {
          initialization: {
            amount,
            payer: { email: "" },
          },
          customization: {
            visual: {
              style: {
                theme: "dark",
                customVariables: {
                  formBackgroundColor: "#2a3925",
                  baseColor: "#16a34a",
                  formPadding: "16px",
                  borderRadiusLarge: "12px",
                  borderRadiusMedium: "8px",
                  borderRadiusSmall: "4px",
                  borderRadiusFull: "9999px",
                },
              },
              hideFormTitle: true,
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              bankTransfer: "all",
              ticket: "all",
              maxInstallments: 1,
            },
          },
          callbacks: {
            onReady: () => {},
            onSubmit: async ({
              formData,
            }: {
              formData: Record<string, unknown>;
            }) => {
              try {
                const response = await fetch("/api/payments/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    planSlug,
                    period,
                    paymentMethodId: formData.payment_method_id,
                    token: formData.token,
                    installments: formData.installments,
                    issuerId: formData.issuer_id,
                  }),
                });

                const result = await response.json();

                if (!response.ok) {
                  onPaymentError(result.error || "Erro ao processar pagamento");
                  return;
                }

                onPaymentSuccess(result);
              } catch {
                onPaymentError("Erro de conexão. Tente novamente.");
              }
            },
            onError: (error: { message?: string }) => {
              onPaymentError(error.message ?? "Erro no pagamento");
            },
          },
        })
        .catch(() => {
          onPaymentError("Erro ao carregar formulário de pagamento");
        });
    };

    document.head.appendChild(script);
  }, [amount, planSlug, period, onPaymentSuccess, onPaymentError]);

  return (
    <div ref={containerRef}>
      <div id="paymentBrick_container" />
    </div>
  );
}
