// src/lib/subscription.ts (atualizar)
import "server-only";
import { getCurrentUser } from "@/lib/user";
import { fetchSubscriptionByEmail } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { StripeSubscription, UserSubscriptionStatus, Subscription } from "@/types";

export async function checkUserSubscription(): Promise<UserSubscriptionStatus> {
  const user = await getCurrentUser();
  
  if (!user) {
    return { isSubscribed: false, user: null };
  }
  
  try {
    // Primeiro, buscar no banco de dados local
    const localSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, 'active')
      ),
    });

    if (localSubscription) {
      // Se encontrou no banco local, verificar se ainda está válida
      const now = new Date();
      const periodEnd = new Date(localSubscription.currentPeriodEnd);
      
      if (periodEnd > now) {
        return {
          isSubscribed: true,
          user,
          subscription: {
            id: localSubscription.stripeSubscriptionId,
            object: 'subscription',
            status: localSubscription.status as any,
            created: Math.floor(new Date(localSubscription.firstSubscriptionDate).getTime() / 1000),
            current_period_start: Math.floor(new Date(localSubscription.currentPeriodStart).getTime() / 1000),
            current_period_end: Math.floor(new Date(localSubscription.currentPeriodEnd).getTime() / 1000),
            start_date: Math.floor(new Date(localSubscription.firstSubscriptionDate).getTime() / 1000),
            customer: localSubscription.stripeCustomerId,
            items: {
              data: [{
                id: localSubscription.stripePriceId,
                price: {
                  id: localSubscription.stripePriceId,
                  unit_amount: localSubscription.planPrice,
                  recurring: {
                    interval: localSubscription.planInterval as 'month' | 'year',
                  },
                  product: {
                    id: '',
                    name: localSubscription.planName,
                  },
                },
              }],
            },
          } as StripeSubscription,
          localSubscription, // Dados completos do banco
        };
      }
    }

    // Se não encontrou no banco ou expirou, verificar no Stripe
    const stripeSubscription = await fetchSubscriptionByEmail(user.email);
    const isSubscribed = stripeSubscription && stripeSubscription.status === 'active';
    
    return { 
      isSubscribed: !!isSubscribed, 
      user,
      subscription: stripeSubscription as StripeSubscription | undefined
    };
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return { isSubscribed: false, user };
  }
}

export function canAccessHistoricalData(isSubscribed: boolean): boolean {
  return isSubscribed;
}

// Função para obter dados detalhados da assinatura
export async function getUserSubscriptionDetails(userId: number): Promise<Subscription | undefined> {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ),
    });
    
    return subscription as Subscription | undefined;
  } catch (error) {
    console.error("Erro ao buscar detalhes da assinatura:", error);
    return undefined;
  }
}