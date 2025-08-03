import "server-only";

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function fetchSubscriptionByEmail(email: string) {  
  const customers = await stripe.customers.list({
    email,
    limit: 1,
    expand: ["data.subscriptions"],
  });

  if (customers.data.length === 0) return null;
  
  const customer = customers.data[0];

  if (customer.subscriptions?.data.length === 0) return null;
  
  return customer.subscriptions?.data[0];
}