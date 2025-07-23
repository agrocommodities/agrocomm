"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/user";
import { stripe, getPriceIdForPlan } from "@/lib/stripe";
import { subscriptions } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function createCheckoutSession(plan: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autorizado" };

  const priceId = getPriceIdForPlan(plan);
  if (!priceId) return { error: "Plano inválido" };

  try {
    // Buscar ou criar customer no Stripe
    let customerId = user.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.profile?.name || '',
        metadata: {
          userId: user.id.toString(),
        },
      });
      customerId = customer.id;
      
      // Salvar customer ID no banco
      const existingSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
      });

      if (existingSubscription) {
        await db.update(subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(eq(subscriptions.userId, user.id));
      } else {
        await db.insert(subscriptions).values({
          userId: user.id,
          stripeCustomerId: customerId,
          plan: "free",
          status: "active",
        });
      }
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        plan,
      },
    });

    return { checkoutUrl: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: "Erro ao criar sessão de pagamento" };
  }
}

export async function managePlan(action: "upgrade" | "downgrade", newPlan: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autorizado" };

  try {
    if (action === "upgrade") {
      // Para upgrade, criar sessão de checkout
      return await createCheckoutSession(newPlan);
    } else {
      // Para downgrade, atualizar a assinatura no Stripe
      if (!user.subscription?.stripeSubscriptionId) {
        return { error: "Assinatura não encontrada" };
      }

      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );

      const newPriceId = getPriceIdForPlan(newPlan);
      if (!newPriceId) return { error: "Plano inválido" };

      // Atualizar assinatura no Stripe
      await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      });

      // Atualizar no banco
      await db.update(subscriptions)
        .set({
          plan: newPlan as any,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.userId, user.id));

      revalidatePath("/perfil");
      return { success: true };
    }
  } catch (error) {
    console.error("Error managing plan:", error);
    return { error: "Erro ao alterar plano" };
  }
}

export async function cancelSubscription() {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autorizado" };

  try {
    if (!user.subscription?.stripeSubscriptionId) {
      return { error: "Assinatura não encontrada" };
    }

    // Cancelar no Stripe (no final do período)
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Atualizar no banco
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.userId, user.id));

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return { error: "Erro ao cancelar assinatura" };
  }
}

export async function reactivateSubscription() {
  const user = await getCurrentUser();
  if (!user) return { error: "Não autorizado" };

  try {
    if (!user.subscription?.stripeSubscriptionId) {
      return { error: "Assinatura não encontrada" };
    }

    // Reativar no Stripe
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Atualizar no banco
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.userId, user.id));

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return { error: "Erro ao reativar assinatura" };
  }
}