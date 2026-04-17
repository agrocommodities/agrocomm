import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptionPlans, subscriptions, payments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createPayment } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { planSlug, period, paymentMethodId, token, installments, issuerId } =
    body;

  if (!planSlug || !paymentMethodId) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, planSlug))
    .limit(1);

  if (!plan || !plan.active) {
    return NextResponse.json(
      { error: "Plano não encontrado" },
      { status: 404 },
    );
  }

  const selectedPeriod = period === "weekly" ? "weekly" : "monthly";
  const amount =
    selectedPeriod === "weekly" ? plan.priceWeekly : plan.priceMonthly;

  try {
    const mpPayment = await createPayment({
      amount,
      description: `AgroComm ${plan.name} — ${selectedPeriod === "monthly" ? "Mensal" : "Semanal"}`,
      paymentMethodId,
      token,
      installments: installments || 1,
      issuerId,
      userEmail: session.email,
      userId: session.userId,
      planSlug: plan.slug,
      period: selectedPeriod,
    });

    // Create or update subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (selectedPeriod === "weekly") {
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.userId))
      .limit(1);

    let subId: number;
    const subStatus = mpPayment.status === "approved" ? "active" : "pending";

    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          planId: plan.id,
          status: subStatus,
          period: selectedPeriod,
          mpPayerId: mpPayment.payer?.id ? String(mpPayment.payer.id) : null,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
          grantedByAdmin: 0,
          grantedBy: null,
          grantedUntil: null,
          cancelledAt: null,
          updatedAt: now.toISOString(),
        })
        .where(eq(subscriptions.id, existingSub.id));
      subId = existingSub.id;
    } else {
      const [newSub] = await db
        .insert(subscriptions)
        .values({
          userId: session.userId,
          planId: plan.id,
          status: subStatus,
          period: selectedPeriod,
          mpPayerId: mpPayment.payer?.id ? String(mpPayment.payer.id) : null,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
        })
        .returning({ id: subscriptions.id });
      subId = newSub.id;
    }

    // Record payment
    const paymentMethodType = mpPayment.payment_type_id;
    let paymentMethodName = "credit_card";
    if (paymentMethodType === "bank_transfer") paymentMethodName = "pix";
    else if (paymentMethodType === "ticket") paymentMethodName = "boleto";
    else if (paymentMethodType === "debit_card")
      paymentMethodName = "debit_card";

    await db.insert(payments).values({
      subscriptionId: subId,
      userId: session.userId,
      mpPaymentId: String(mpPayment.id),
      mpStatus: mpPayment.status ?? "pending",
      amount,
      paymentMethod: paymentMethodName,
      pixQrCode:
        (mpPayment.point_of_interaction?.transaction_data?.qr_code as string) ??
        null,
      pixQrCodeBase64:
        (mpPayment.point_of_interaction?.transaction_data
          ?.qr_code_base64 as string) ?? null,
      boletoUrl:
        (mpPayment.transaction_details?.external_resource_url as string) ??
        null,
      paidAt: mpPayment.status === "approved" ? now.toISOString() : null,
    });

    return NextResponse.json({
      status: mpPayment.status,
      paymentId: mpPayment.id,
      pixQrCode:
        mpPayment.point_of_interaction?.transaction_data?.qr_code ?? null,
      pixQrCodeBase64:
        mpPayment.point_of_interaction?.transaction_data?.qr_code_base64 ??
        null,
      boletoUrl: mpPayment.transaction_details?.external_resource_url ?? null,
    });
  } catch (err) {
    console.error("Payment creation error:", err);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 },
    );
  }
}
