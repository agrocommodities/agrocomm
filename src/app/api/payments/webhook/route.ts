import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, payments, subscriptionPlans, users } from "@/db/schema";
import { getPaymentById } from "@/lib/mercadopago";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionWelcomeEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.type === "payment" && body.data?.id) {
    try {
      const mpPayment = await getPaymentById(body.data.id);
      if (!mpPayment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 },
        );
      }

      const metadata = mpPayment.metadata ?? {};
      const userId = metadata.user_id as number | undefined;
      const planSlug = metadata.plan_slug as string | undefined;
      const period = (metadata.period as string) ?? "monthly";

      if (!userId || !planSlug) {
        return NextResponse.json({ ok: true });
      }

      // Find or create subscription
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.slug, planSlug))
        .limit(1);

      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      const paymentMethodType = mpPayment.payment_type_id;
      let paymentMethod = "credit_card";
      if (paymentMethodType === "bank_transfer") paymentMethod = "pix";
      else if (paymentMethodType === "ticket") paymentMethod = "boleto";
      else if (paymentMethodType === "debit_card") paymentMethod = "debit_card";

      // Upsert payment record
      const existingPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.mpPaymentId, String(mpPayment.id)))
        .limit(1);

      const paymentData = {
        mpPaymentId: String(mpPayment.id),
        mpStatus: mpPayment.status ?? "unknown",
        amount: mpPayment.transaction_amount ?? 0,
        paymentMethod,
        pixQrCode:
          (mpPayment.point_of_interaction?.transaction_data
            ?.qr_code as string) ?? null,
        pixQrCodeBase64:
          (mpPayment.point_of_interaction?.transaction_data
            ?.qr_code_base64 as string) ?? null,
        boletoUrl:
          (mpPayment.transaction_details?.external_resource_url as string) ??
          null,
        paidAt:
          mpPayment.status === "approved" ? new Date().toISOString() : null,
      };

      if (existingPayments.length > 0) {
        await db
          .update(payments)
          .set(paymentData)
          .where(eq(payments.id, existingPayments[0].id));
      } else {
        // Find existing subscription
        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);

        let subId = existingSub?.id;

        if (!subId) {
          const now = new Date();
          const periodEnd = new Date(now);
          if (period === "weekly") {
            periodEnd.setDate(periodEnd.getDate() + 7);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          const [newSub] = await db
            .insert(subscriptions)
            .values({
              userId,
              planId: plan.id,
              status: mpPayment.status === "approved" ? "active" : "pending",
              period: period as "monthly" | "weekly",
              mpPayerId: mpPayment.payer?.id
                ? String(mpPayment.payer.id)
                : null,
              currentPeriodStart: now.toISOString(),
              currentPeriodEnd: periodEnd.toISOString(),
            })
            .returning({ id: subscriptions.id });
          subId = newSub.id;
        }

        await db.insert(payments).values({
          ...paymentData,
          subscriptionId: subId,
          userId,
        });
      }

      // Update subscription status based on payment
      if (mpPayment.status === "approved") {
        const now = new Date();
        const periodEnd = new Date(now);
        if (period === "weekly") {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db
          .update(subscriptions)
          .set({
            status: "active",
            planId: plan.id,
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            updatedAt: now.toISOString(),
          })
          .where(eq(subscriptions.userId, userId));

        // Send success emails
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user) {
          await sendPaymentSuccessEmail(
            user.email,
            user.name,
            mpPayment.transaction_amount ?? 0,
            paymentMethod,
          ).catch(() => {});
          await sendSubscriptionWelcomeEmail(
            user.email,
            user.name,
            plan.name,
          ).catch(() => {});
        }
      } else if (
        mpPayment.status === "rejected" ||
        mpPayment.status === "cancelled"
      ) {
        await db
          .update(subscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subscriptions.userId, userId));

        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user) {
          await sendPaymentFailedEmail(user.email, user.name, plan.name).catch(
            () => {},
          );
        }
      }
    } catch (err) {
      console.error("Webhook payment processing error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
