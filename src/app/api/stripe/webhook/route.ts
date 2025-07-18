import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.userId || "0");
        const plan = session.metadata?.plan;

        if (userId && plan && session.subscription) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const subscription = subscriptionResponse as Stripe.Subscription;

          // Acesso seguro às propriedades de período
          const currentPeriodStart = subscription.currentPeriodStart;
          const currentPeriodEnd = subscription.currentPeriodEnd;

          await db
            .insert(subscriptions)
            .values({
              userId,
              plan: plan as any,
              status: subscription.status as any,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
            })
            .onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                plan: plan as any,
                status: subscription.status as any,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
                currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
              },
            });
        }
        break;
      }

      case "customer.subscription.updated": {
        // Correção: Cast explícito para acessar propriedades específicas
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start: number;
          current_period_end: number;
        };
        
        const customerId = subscription.customer as string;

        const userSubscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeCustomerId, customerId),
        });

        if (userSubscription) {
          let plan = "free";
          const priceId = subscription.items.data[0]?.price.id;
          
          if (priceId === process.env.STRIPE_PRICE_BASIC) plan = "basic";
          else if (priceId === process.env.STRIPE_PRICE_PRO) plan = "pro";
          else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) plan = "enterprise";

          await db
            .update(subscriptions)
            .set({
              plan: plan as any,
              status: subscription.status as any,
              // Acesso direto às propriedades após cast
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(subscriptions.stripeCustomerId, customerId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db
          .update(subscriptions)
          .set({
            plan: "free",
            status: "cancelled",
            stripeSubscriptionId: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}