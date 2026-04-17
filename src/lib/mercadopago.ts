import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

function getClient() {
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return new MercadoPagoConfig({ accessToken });
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

interface CreatePaymentPreferenceParams {
  planName: string;
  planSlug: string;
  amount: number;
  period: "monthly" | "weekly";
  userId: number;
  userEmail: string;
  userName: string;
}

export async function createPaymentPreference(
  params: CreatePaymentPreferenceParams,
) {
  const client = getClient();
  const preference = new Preference(client);
  const appUrl = getAppUrl();

  const result = await preference.create({
    body: {
      items: [
        {
          id: `plan-${params.planSlug}-${params.period}`,
          title: `AgroComm ${params.planName} — ${params.period === "monthly" ? "Mensal" : "Semanal"}`,
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: params.userEmail,
        name: params.userName,
      },
      metadata: {
        user_id: params.userId,
        plan_slug: params.planSlug,
        period: params.period,
      },
      back_urls: {
        success: `${appUrl}/planos/resultado?status=success`,
        failure: `${appUrl}/planos/resultado?status=failure`,
        pending: `${appUrl}/planos/resultado?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook`,
      statement_descriptor: "AGROCOMM",
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    },
  });

  return result;
}

interface CreatePaymentParams {
  amount: number;
  description: string;
  paymentMethodId: string;
  token?: string;
  installments?: number;
  issuerId?: string;
  userEmail: string;
  userId: number;
  planSlug: string;
  period: "monthly" | "weekly";
}

export async function createPayment(params: CreatePaymentParams) {
  const client = getClient();
  const payment = new Payment(client);
  const appUrl = getAppUrl();

  const body: Record<string, unknown> = {
    transaction_amount: params.amount,
    description: params.description,
    payment_method_id: params.paymentMethodId,
    payer: {
      email: params.userEmail,
    },
    metadata: {
      user_id: params.userId,
      plan_slug: params.planSlug,
      period: params.period,
    },
    notification_url: `${appUrl}/api/payments/webhook`,
    statement_descriptor: "AGROCOMM",
  };

  if (params.token) {
    body.token = params.token;
  }
  if (params.installments) {
    body.installments = params.installments;
  }
  if (params.issuerId) {
    body.issuer_id = params.issuerId;
  }

  const result = await payment.create({
    body: body as Parameters<typeof payment.create>[0]["body"],
  });

  return result;
}

export async function getPaymentById(paymentId: string | number) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: Number(paymentId) });
}
