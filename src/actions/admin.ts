"use server";

import { db } from "@/db";
import {
  users,
  quotes,
  products,
  regions,
  sources,
  scraperLogs,
  pageViews,
} from "@/db/schema";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";


// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return session;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getAdminDashboard() {
  await requireAdmin();

  const today = new Date().toISOString().slice(0, 10);

  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalQuotes] = await db.select({ count: count() }).from(quotes);
  const [todayQuotes] = await db
    .select({ count: count() })
    .from(quotes)
    .where(eq(quotes.quoteDate, today));
  const [totalViews] = await db.select({ count: count() }).from(pageViews);

  const recentLogs = await db
    .select({
      id: scraperLogs.id,
      status: scraperLogs.status,
      quotesInserted: scraperLogs.quotesInserted,
      errorMessage: scraperLogs.errorMessage,
      executedAt: scraperLogs.executedAt,
      sourceName: sources.name,
    })
    .from(scraperLogs)
    .leftJoin(sources, eq(scraperLogs.sourceId, sources.id))
    .orderBy(desc(scraperLogs.executedAt))
    .limit(10);

  return {
    totalUsers: totalUsers.count,
    totalQuotes: totalQuotes.count,
    todayQuotes: todayQuotes.count,
    totalViews: totalViews.count,
    recentLogs,
  };
}

// ── Quotes management ─────────────────────────────────────────────────────────

export async function getAdminQuotes(page = 1, productFilter?: string) {
  await requireAdmin();

  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = productFilter
    ? eq(products.slug, productFilter)
    : undefined;

  const rows = await db
    .select({
      id: quotes.id,
      productName: products.name,
      productSlug: products.slug,
      regionName: regions.name,
      state: regions.state,
      sourceName: sources.name,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(regions, eq(quotes.regionId, regions.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(conditions)
    .orderBy(desc(quotes.quoteDate), products.name, regions.state)
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ count: count() })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(conditions);

  const allProducts = await db
    .select({ slug: products.slug, name: products.name })
    .from(products)
    .orderBy(products.name);

  return { rows, total: total.count, page, limit, allProducts };
}

export async function deleteQuoteAction(id: number) {
  await requireAdmin();
  await db.delete(quotes).where(eq(quotes.id, id));
  return { success: true };
}

export async function createQuoteAction(formData: FormData) {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  const regionId = Number(formData.get("regionId"));
  const sourceId = Number(formData.get("sourceId"));
  const price = Number(formData.get("price"));
  const variation = formData.get("variation")
    ? Number(formData.get("variation"))
    : null;
  const quoteDate = String(formData.get("quoteDate") ?? "");

  if (!productId || !regionId || !sourceId || !price || !quoteDate) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  await db.insert(quotes).values({
    productId,
    regionId,
    sourceId,
    price,
    variation,
    quoteDate,
  });

  return { success: true };
}

export async function getQuoteFormData() {
  await requireAdmin();

  const allProducts = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .orderBy(products.name);
  const allRegions = await db
    .select({
      id: regions.id,
      name: regions.name,
      state: regions.state,
    })
    .from(regions)
    .orderBy(regions.state, regions.name);
  const allSources = await db
    .select({ id: sources.id, name: sources.name })
    .from(sources)
    .orderBy(sources.name);

  return { allProducts, allRegions, allSources };
}

// ── Users management ──────────────────────────────────────────────────────────

export async function getAdminUsers() {
  await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return rows;
}

export async function updateUserRoleAction(userId: number, role: string) {
  const session = await requireAdmin();
  if (userId === session.userId) {
    return { error: "Você não pode alterar seu próprio papel." };
  }
  if (role !== "admin" && role !== "user") {
    return { error: "Papel inválido." };
  }
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

export async function deleteUserAction(userId: number) {
  const session = await requireAdmin();
  if (userId === session.userId) {
    return { error: "Você não pode excluir sua própria conta." };
  }
  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter no mínimo 8 caracteres." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "Este e-mail já está cadastrado." };

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name, email, passwordHash, role });
  return { success: true };
}

// ── Scraper ───────────────────────────────────────────────────────────────────

export async function getScraperInfo() {
  await requireAdmin();

  const allSources = await db
    .select({
      id: sources.id,
      name: sources.name,
      slug: sources.slug,
      url: sources.url,
      priority: sources.priority,
      active: sources.active,
    })
    .from(sources)
    .orderBy(sources.priority);

  const logs = await db
    .select({
      id: scraperLogs.id,
      status: scraperLogs.status,
      quotesInserted: scraperLogs.quotesInserted,
      errorMessage: scraperLogs.errorMessage,
      executedAt: scraperLogs.executedAt,
      sourceName: sources.name,
    })
    .from(scraperLogs)
    .leftJoin(sources, eq(scraperLogs.sourceId, sources.id))
    .orderBy(desc(scraperLogs.executedAt))
    .limit(30);

  return { allSources, logs };
}

export async function toggleSourceAction(sourceId: number, active: boolean) {
  await requireAdmin();
  await db
    .update(sources)
    .set({ active: active ? 1 : 0 })
    .where(eq(sources.id, sourceId));
  return { success: true };
}

// ── Statistics ────────────────────────────────────────────────────────────────

export async function getPageViewStats() {
  await requireAdmin();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceStr = thirtyDaysAgo.toISOString().slice(0, 10);

  // Total views
  const [totalViews] = await db.select({ count: count() }).from(pageViews);

  // Views last 30 days
  const [recentViews] = await db
    .select({ count: count() })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sinceStr));

  // Unique sessions last 30 days
  const uniqueSessions = await db
    .select({ count: sql<number>`count(distinct ${pageViews.sessionId})` })
    .from(pageViews)
    .where(
      and(
        gte(pageViews.createdAt, sinceStr),
        sql`${pageViews.sessionId} is not null`,
      ),
    );

  // Views per day (last 30 days)
  const viewsPerDay = await db
    .select({
      date: sql<string>`date(${pageViews.createdAt})`.as("date"),
      views: count().as("views"),
      uniqueVisitors: sql<number>`count(distinct ${pageViews.sessionId})`.as(
        "unique_visitors",
      ),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sinceStr))
    .groupBy(sql`date(${pageViews.createdAt})`)
    .orderBy(sql`date(${pageViews.createdAt})`);

  // Top pages
  const topPages = await db
    .select({
      path: pageViews.path,
      views: count().as("views"),
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, sinceStr))
    .groupBy(pageViews.path)
    .orderBy(desc(count()))
    .limit(15);

  // Top referrers
  const topReferrers = await db
    .select({
      referrer: pageViews.referrer,
      views: count().as("views"),
    })
    .from(pageViews)
    .where(
      and(
        gte(pageViews.createdAt, sinceStr),
        sql`${pageViews.referrer} is not null and ${pageViews.referrer} != ''`,
      ),
    )
    .groupBy(pageViews.referrer)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalViews: totalViews.count,
    recentViews: recentViews.count,
    uniqueSessions: uniqueSessions[0]?.count ?? 0,
    viewsPerDay,
    topPages,
    topReferrers,
  };
}
