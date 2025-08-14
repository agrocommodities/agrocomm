// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { 
  StripeWebhookEvent, 
  StripeSubscriptionFromWebhook, 
  StripeInvoice, 
  StripeCustomer,
  StripeProduct 
} from "@/types";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: StripeWebhookEvent;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret) as StripeWebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as StripeSubscriptionFromWebhook);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as StripeSubscriptionFromWebhook);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as StripeInvoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionChange(subscription: StripeSubscriptionFromWebhook) {
  try {
    // Buscar customer do Stripe para pegar o email
    const customer = await stripe.customers.retrieve(subscription.customer) as StripeCustomer;
    if (!customer || customer.deleted) return;

    // Buscar usuário pelo email
    const user = await db.query.users.findFirst({
      where: eq(users.email, customer.email),
    });

    if (!user) return;

    // Buscar informações do produto/preço
    const price = subscription.items.data[0].price;
    let productId: string;
    
    if (typeof price.product === 'string') {
      productId = price.product;
    } else {
      productId = price.product.id;
    }
    
    const product = await stripe.products.retrieve(productId) as StripeProduct;

    // Converter timestamps do Stripe (segundos) para ISO strings
    const subscriptionData = {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price.id,
      stripeCustomerId: subscription.customer,
      status: subscription.status,
      planName: product.name,
      planPrice: price.unit_amount,
      planInterval: price.recurring.interval,
      firstSubscriptionDate: new Date(subscription.created * 1000).toISOString(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      lastPaymentDate: new Date(subscription.current_period_start * 1000).toISOString(),
      
      // Novos campos
      cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    };

    // Verificar se já existe
    const existing = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    });

    if (existing) {
      // Atualizar
      await db
        .update(subscriptions)
        .set({
          ...subscriptionData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    } else {
      // Criar novo
      await db.insert(subscriptions).values({
        ...subscriptionData,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionDeleted(subscription: StripeSubscriptionFromWebhook) {
  try {
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: StripeInvoice) {
  try {
    if (invoice.subscription) {
      await db
        .update(subscriptions)
        .set({
          lastPaymentDate: new Date(invoice.created * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}