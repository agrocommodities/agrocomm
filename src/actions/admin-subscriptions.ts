"use server";

import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionAlertSettings,
  users,
  payments,
} from "@/db/schema";
import { getSession, getUserPermissions } from "@/lib/auth";

async function requireAdminSubscriptions() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");
  const perms = await getUserPermissions(session.userId);
  if (
    !perms.has("admin.subscriptions") &&
    session.email !== "agrocomm@agrocomm.com.br"
  ) {
    throw new Error("Sem permissão");
  }
  return session;
}

// ── List all subscriptions ──────────────────────────────────────────────────

export interface AdminSubscriptionRow {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  planSlug: string;
  status: string;
  period: string;
  grantedByAdmin: number;
  grantedUntil: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export async function getAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  await requireAdminSubscriptions();

  return db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      userName: users.name,
      userEmail: users.email,
      planName: subscriptionPlans.name,
      planSlug: subscriptionPlans.slug,
      status: subscriptions.status,
      period: subscriptions.period,
      grantedByAdmin: subscriptions.grantedByAdmin,
      grantedUntil: subscriptions.grantedUntil,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .orderBy(desc(subscriptions.createdAt));
}

// ── Admin grant plan ────────────────────────────────────────────────────────

export async function adminGrantPlan(
  userId: number,
  planSlug: string,
  until: string | null,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdminSubscriptions();

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, planSlug))
    .limit(1);

  if (!plan) return { success: false, error: "Plano não encontrado" };

  // Check if user already has a subscription
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        planId: plan.id,
        status: "active",
        grantedByAdmin: 1,
        grantedBy: session.userId,
        grantedUntil: until,
        currentPeriodStart: now,
        currentPeriodEnd: until,
        cancelledAt: null,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId,
      planId: plan.id,
      status: "active",
      period: "monthly",
      grantedByAdmin: 1,
      grantedBy: session.userId,
      grantedUntil: until,
      currentPeriodStart: now,
      currentPeriodEnd: until,
    });
  }

  return { success: true };
}

// ── Admin change plan ───────────────────────────────────────────────────────

export async function adminChangePlan(
  subscriptionId: number,
  newPlanSlug: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdminSubscriptions();

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, newPlanSlug))
    .limit(1);

  if (!plan) return { success: false, error: "Plano não encontrado" };

  await db
    .update(subscriptions)
    .set({ planId: plan.id, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, subscriptionId));

  return { success: true };
}

// ── Admin cancel subscription ───────────────────────────────────────────────

export async function adminCancelSubscription(
  subscriptionId: number,
): Promise<{ success: boolean }> {
  await requireAdminSubscriptions();

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  return { success: true };
}

// ── Plan management ─────────────────────────────────────────────────────────

export async function getAdminPlans() {
  await requireAdminSubscriptions();

  return db
    .select()
    .from(subscriptionPlans)
    .orderBy(subscriptionPlans.sortOrder);
}

export async function updatePlanAction(
  planId: number,
  data: {
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceWeekly?: number;
    maxClassifieds?: number;
    emailBulletins?: number;
    priceHistory?: number;
    historyDays?: number;
    active?: number;
  },
): Promise<{ success: boolean }> {
  await requireAdminSubscriptions();

  await db
    .update(subscriptionPlans)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(subscriptionPlans.id, planId));

  return { success: true };
}

// ── Alert settings ──────────────────────────────────────────────────────────

export async function getAlertSettings() {
  await requireAdminSubscriptions();
  return db.select().from(subscriptionAlertSettings);
}

export async function updateAlertSettingAction(
  alertId: number,
  data: {
    enabled?: number;
    daysBefore?: number;
    daysAfter?: number;
    maxAttempts?: number;
    intervalHours?: number;
  },
): Promise<{ success: boolean }> {
  await requireAdminSubscriptions();

  await db
    .update(subscriptionAlertSettings)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(subscriptionAlertSettings.id, alertId));

  return { success: true };
}

// ── Dashboard stats ─────────────────────────────────────────────────────────

export async function getSubscriptionStats() {
  await requireAdminSubscriptions();

  const [totalActive] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const [totalRevenue] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.mpStatus, "approved"));

  const [thisMonth] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        sql`${subscriptions.createdAt} >= datetime('now', 'start of month')`,
      ),
    );

  return {
    activeSubscriptions: totalActive?.count ?? 0,
    totalRevenue: totalRevenue?.total ?? 0,
    newThisMonth: thisMonth?.count ?? 0,
  };
}

// ── Get all users for admin grant ───────────────────────────────────────────

export async function getAdminUsersForGrant() {
  await requireAdminSubscriptions();

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .orderBy(users.name);
}
