"use server";

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  subscriptionPlans,
  subscriptions,
  payments,
  userQuoteSubscriptions,
  products,
  cities,
  states,
} from "@/db/schema";
import { getSession } from "@/lib/auth";

export interface PlanRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceWeekly: number;
  maxClassifieds: number;
  emailBulletins: number;
  priceHistory: number;
  historyDays: number;
  sortOrder: number;
}

export async function getSubscriptionPlans(): Promise<PlanRow[]> {
  return db
    .select({
      id: subscriptionPlans.id,
      slug: subscriptionPlans.slug,
      name: subscriptionPlans.name,
      description: subscriptionPlans.description,
      priceMonthly: subscriptionPlans.priceMonthly,
      priceWeekly: subscriptionPlans.priceWeekly,
      maxClassifieds: subscriptionPlans.maxClassifieds,
      emailBulletins: subscriptionPlans.emailBulletins,
      priceHistory: subscriptionPlans.priceHistory,
      historyDays: subscriptionPlans.historyDays,
      sortOrder: subscriptionPlans.sortOrder,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.active, 1))
    .orderBy(subscriptionPlans.sortOrder);
}

export interface UserSubscription {
  id: number;
  planId: number;
  planSlug: string;
  planName: string;
  status: string;
  period: string;
  grantedByAdmin: number;
  grantedUntil: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  maxClassifieds: number;
  emailBulletins: number;
  priceHistory: number;
  historyDays: number;
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      planSlug: subscriptionPlans.slug,
      planName: subscriptionPlans.name,
      status: subscriptions.status,
      period: subscriptions.period,
      grantedByAdmin: subscriptions.grantedByAdmin,
      grantedUntil: subscriptions.grantedUntil,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      maxClassifieds: subscriptionPlans.maxClassifieds,
      emailBulletins: subscriptionPlans.emailBulletins,
      priceHistory: subscriptionPlans.priceHistory,
      historyDays: subscriptionPlans.historyDays,
    })
    .from(subscriptions)
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(eq(subscriptions.userId, session.userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (rows.length === 0) return null;

  const sub = rows[0];

  // Check if expired
  if (sub.status === "active") {
    if (sub.grantedByAdmin && sub.grantedUntil) {
      if (new Date(sub.grantedUntil) < new Date()) {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date().toISOString() })
          .where(eq(subscriptions.id, sub.id));
        return { ...sub, status: "expired" };
      }
    } else if (!sub.grantedByAdmin && sub.currentPeriodEnd) {
      if (new Date(sub.currentPeriodEnd) < new Date()) {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date().toISOString() })
          .where(eq(subscriptions.id, sub.id));
        return { ...sub, status: "expired" };
      }
    }
  }

  return sub;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const sub = await getUserSubscription();
  return sub !== null && sub.status === "active";
}

export async function cancelSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session) return { success: false, error: "Não autenticado" };

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.userId),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!sub) return { success: false, error: "Nenhuma assinatura ativa" };

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.id, sub.id));

  return { success: true };
}

export interface QuoteSubscriptionItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  cityId: number | null;
  cityName: string | null;
  stateName: string | null;
}

export async function getUserQuoteSubscriptions(): Promise<
  QuoteSubscriptionItem[]
> {
  const session = await getSession();
  if (!session) return [];

  const rows = await db
    .select({
      id: userQuoteSubscriptions.id,
      productId: userQuoteSubscriptions.productId,
      productName: products.name,
      productSlug: products.slug,
      cityId: userQuoteSubscriptions.cityId,
      cityName: cities.name,
      stateName: states.name,
    })
    .from(userQuoteSubscriptions)
    .innerJoin(products, eq(userQuoteSubscriptions.productId, products.id))
    .leftJoin(cities, eq(userQuoteSubscriptions.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(eq(userQuoteSubscriptions.userId, session.userId));

  return rows;
}

export async function toggleQuoteSubscription(
  productId: number,
  cityId: number | null,
): Promise<{ subscribed: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { subscribed: false, error: "Não autenticado" };

  // Check if user has active subscription
  const sub = await getUserSubscription();
  if (!sub || sub.status !== "active" || !sub.emailBulletins) {
    return { subscribed: false, error: "Necessário plano ativo com boletins" };
  }

  const conditions = [
    eq(userQuoteSubscriptions.userId, session.userId),
    eq(userQuoteSubscriptions.productId, productId),
  ];

  if (cityId) {
    conditions.push(eq(userQuoteSubscriptions.cityId, cityId));
  }

  const [existing] = await db
    .select({ id: userQuoteSubscriptions.id })
    .from(userQuoteSubscriptions)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    await db
      .delete(userQuoteSubscriptions)
      .where(eq(userQuoteSubscriptions.id, existing.id));
    return { subscribed: false };
  }

  await db.insert(userQuoteSubscriptions).values({
    userId: session.userId,
    productId,
    cityId,
  });

  return { subscribed: true };
}

export async function removeQuoteSubscription(
  subscriptionId: number,
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) return { success: false };

  await db
    .delete(userQuoteSubscriptions)
    .where(
      and(
        eq(userQuoteSubscriptions.id, subscriptionId),
        eq(userQuoteSubscriptions.userId, session.userId),
      ),
    );

  return { success: true };
}

export async function getUserPayments() {
  const session = await getSession();
  if (!session) return [];

  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      mpStatus: payments.mpStatus,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, session.userId))
    .orderBy(desc(payments.createdAt))
    .limit(20);
}
