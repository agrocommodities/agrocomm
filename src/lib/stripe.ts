// src/lib/stripe.ts
import "server-only";
import Stripe from "stripe";
import type { StripeSubscription } from "@/types";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function fetchSubscriptionByEmail(email: string): Promise<StripeSubscription | null> {  
  const customers = await stripe.customers.list({
    email,
    limit: 1,
    expand: ["data.subscriptions"],
  });

  if (customers.data.length === 0) return null;
  
  const customer = customers.data[0];

  if (!customer.subscriptions?.data.length) return null;
  
  const subscription = customer.subscriptions.data[0];
  
  // Converter para o nosso formato de tipo
  return {
    id: subscription.id,
    object: 'subscription',
    status: subscription.status as StripeSubscription['status'],
    created: subscription.created,
    current_period_start: (subscription as any).current_period_start,
    current_period_end: (subscription as any).current_period_end,
    start_date: subscription.start_date || subscription.created,
    customer: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    items: {
      data: subscription.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount || 0,
          recurring: {
            interval: item.price.recurring?.interval as 'month' | 'year' || 'month',
          },
          product: {
            id: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
            name: typeof item.price.product === 'string' ? '' : ('name' in item.price.product ? item.price.product.name : '') || '',
          },
        },
      })),
    },
  };
}