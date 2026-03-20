"use server";

import { db } from "@/db";
import {
  users,
  quotes,
  products,
  cities,
  states,
  sources,
  scraperLogs,
  pageViews,
  quoteConflicts,
  newsArticles,
  newsSources,
} from "@/db/schema";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { rm, stat, readdir, rmdir } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
      cityName: cities.name,
      state: states.code,
      sourceName: sources.name,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(conditions)
    .orderBy(desc(quotes.quoteDate), products.name, states.code)
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

export async function pruneAllQuotesAction() {
  await requireAdmin();
  const result = await db.delete(quotes);
  return { success: true, deleted: result.rowsAffected ?? 0 };
}

export async function pruneQuotesAction(date: string) {
  await requireAdmin();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Data inválida." };
  }

  const result = await db.delete(quotes).where(eq(quotes.quoteDate, date));

  return { success: true, deleted: result.rowsAffected ?? 0 };
}

export async function createQuoteAction(formData: FormData) {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  const cityId = Number(formData.get("cityId"));
  const sourceId = Number(formData.get("sourceId"));
  const price = Number(formData.get("price"));
  const variation = formData.get("variation")
    ? Number(formData.get("variation"))
    : null;
  const quoteDate = String(formData.get("quoteDate") ?? "");

  if (!productId || !cityId || !sourceId || !price || !quoteDate) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  await db.insert(quotes).values({
    productId,
    cityId,
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
  const allCities = await db
    .select({
      id: cities.id,
      name: cities.name,
      state: states.code,
    })
    .from(cities)
    .innerJoin(states, eq(cities.stateId, states.id))
    .orderBy(states.code, cities.name);
  const allSources = await db
    .select({ id: sources.id, name: sources.name })
    .from(sources)
    .orderBy(sources.name);

  return { allProducts, allCities, allSources };
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

// ── Conflicts ─────────────────────────────────────────────────────────────────

export async function getConflicts() {
  await requireAdmin();

  const rows = await db
    .select({
      id: quoteConflicts.id,
      quoteId: quoteConflicts.quoteId,
      productName: products.name,
      cityName: cities.name,
      stateCode: states.code,
      quoteDate: quoteConflicts.quoteDate,
      keptSourceName: sql<string>`ks.name`.as("kept_source_name"),
      keptPrice: quoteConflicts.keptPrice,
      rejectedSourceName: sql<string>`rs.name`.as("rejected_source_name"),
      rejectedPrice: quoteConflicts.rejectedPrice,
      status: quoteConflicts.status,
      createdAt: quoteConflicts.createdAt,
    })
    .from(quoteConflicts)
    .innerJoin(products, eq(quoteConflicts.productId, products.id))
    .innerJoin(cities, eq(quoteConflicts.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(
      sql`${sources} as ks`,
      sql`ks.id = ${quoteConflicts.keptSourceId}`,
    )
    .innerJoin(
      sql`${sources} as rs`,
      sql`rs.id = ${quoteConflicts.rejectedSourceId}`,
    )
    .orderBy(desc(quoteConflicts.createdAt));

  return rows;
}

export async function acceptConflictAction(conflictId: number) {
  await requireAdmin();

  const [conflict] = await db
    .select()
    .from(quoteConflicts)
    .where(eq(quoteConflicts.id, conflictId))
    .limit(1);

  if (!conflict) return { error: "Conflito não encontrado." };
  if (conflict.status !== "pending") return { error: "Conflito já resolvido." };

  // Switch to the rejected source's price
  await db
    .update(quotes)
    .set({
      price: conflict.rejectedPrice,
      sourceId: conflict.rejectedSourceId,
    })
    .where(eq(quotes.id, conflict.quoteId));

  await db
    .update(quoteConflicts)
    .set({
      status: "accepted",
      resolvedAt: new Date().toISOString(),
    })
    .where(eq(quoteConflicts.id, conflictId));

  return { success: true };
}

export async function dismissConflictAction(conflictId: number) {
  await requireAdmin();

  const [conflict] = await db
    .select()
    .from(quoteConflicts)
    .where(eq(quoteConflicts.id, conflictId))
    .limit(1);

  if (!conflict) return { error: "Conflito não encontrado." };
  if (conflict.status !== "pending") return { error: "Conflito já resolvido." };

  await db
    .update(quoteConflicts)
    .set({
      status: "dismissed",
      resolvedAt: new Date().toISOString(),
    })
    .where(eq(quoteConflicts.id, conflictId));

  return { success: true };
}

// ── News management ──────────────────────────────────────────────────────────

export async function getAdminNews(page = 1, categoryFilter?: string) {
  await requireAdmin();

  const limit = 30;
  const offset = (page - 1) * limit;

  const conditions = categoryFilter
    ? eq(newsArticles.category, categoryFilter)
    : undefined;

  const rows = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      excerpt: newsArticles.excerpt,
      imageUrl: newsArticles.imageUrl,
      sourceUrl: newsArticles.sourceUrl,
      sourceName: newsArticles.sourceName,
      category: newsArticles.category,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
    })
    .from(newsArticles)
    .where(conditions)
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ count: count() })
    .from(newsArticles)
    .where(conditions);

  return { rows, total: total.count, page, limit };
}

export async function deleteNewsAction(id: number) {
  await requireAdmin();
  await db.delete(newsArticles).where(eq(newsArticles.id, id));
  const imageDir = path.join(
    process.cwd(),
    "public",
    "images",
    "posts",
    String(id),
  );
  await rm(imageDir, { recursive: true, force: true });
  return { success: true };
}

export async function pruneAllNewsAction() {
  await requireAdmin();
  const articles = await db.select({ id: newsArticles.id }).from(newsArticles);
  const result = await db.delete(newsArticles);
  await Promise.all(
    articles.map(({ id }) =>
      rm(path.join(process.cwd(), "public", "images", "posts", String(id)), {
        recursive: true,
        force: true,
      }),
    ),
  );
  return { success: true, deleted: result.rowsAffected ?? 0 };
}

export async function getNewsSources() {
  await requireAdmin();
  return db
    .select({
      id: newsSources.id,
      slug: newsSources.slug,
      name: newsSources.name,
      url: newsSources.url,
      category: newsSources.category,
      active: newsSources.active,
    })
    .from(newsSources)
    .orderBy(newsSources.name);
}

export async function toggleNewsSourceAction(id: number, active: boolean) {
  await requireAdmin();
  await db
    .update(newsSources)
    .set({ active: active ? 1 : 0 })
    .where(eq(newsSources.id, id));
  return { success: true };
}

// ── Armazenamento ─────────────────────────────────────────────────────────────

interface DiskUsage {
  total: number;
  used: number;
  available: number;
}

async function getDiskUsage(): Promise<DiskUsage> {
  const { stdout } = await execFileAsync("df", [
    "-B1",
    "--output=size,used,avail",
    "/",
  ]);
  const lines = stdout.trim().split("\n");
  const parts = lines[1].trim().split(/\s+/);
  return {
    total: Number(parts[0]),
    used: Number(parts[1]),
    available: Number(parts[2]),
  };
}

export interface PostStorageInfo {
  articleId: number;
  title: string;
  slug: string;
  publishedAt: string;
  imageUrl: string | null;
  mediaSize: number;
  mediaCount: number;
}

export interface StorageData {
  disk: DiskUsage;
  posts: PostStorageInfo[];
}

export async function getStorageInfo(): Promise<StorageData> {
  await requireAdmin();

  const disk = await getDiskUsage();

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      publishedAt: newsArticles.publishedAt,
      imageUrl: newsArticles.imageUrl,
    })
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt));

  // Collect media sizes for each article
  const posts: PostStorageInfo[] = [];

  for (const article of articles) {
    let mediaSize = 0;
    let mediaCount = 0;

    if (article.imageUrl) {
      // imageUrl is relative, e.g. /posts/2026/03/uuid.jpg or /images/posts/123/image.jpg
      const filePath = path.join(process.cwd(), "public", article.imageUrl);
      try {
        const s = await stat(filePath);
        mediaSize = s.size;
        mediaCount = 1;
      } catch {
        // file missing
      }
    }

    posts.push({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl,
      mediaSize,
      mediaCount,
    });
  }

  return { disk, posts };
}

export async function deleteEmptyImageDirs(): Promise<{ deleted: number }> {
  await requireAdmin();
  const baseDir = path.join(process.cwd(), "public", "images", "posts");
  let deleted = 0;

  try {
    const entries = await readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(baseDir, entry.name);
      const contents = await readdir(dirPath);
      if (contents.length === 0) {
        await rmdir(dirPath);
        deleted++;
      }
    }
  } catch {
    // base dir may not exist
  }

  return { deleted };
}

export interface OrphanMedia {
  filePath: string;
  relativePath: string;
  size: number;
}

async function collectFiles(
  dir: string,
  base: string,
): Promise<{ relativePath: string; fullPath: string; size: number }[]> {
  const result: { relativePath: string; fullPath: string; size: number }[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...(await collectFiles(full, base)));
      } else if (entry.isFile()) {
        const s = await stat(full);
        const rel = `/${path.relative(base, full)}`;
        result.push({ relativePath: rel, fullPath: full, size: s.size });
      }
    }
  } catch {
    // dir may not exist
  }
  return result;
}

export async function detectOrphanMedia(): Promise<OrphanMedia[]> {
  await requireAdmin();
  const publicDir = path.join(process.cwd(), "public");

  // Collect all files from both media directories
  const allFiles = [
    ...(await collectFiles(path.join(publicDir, "images", "posts"), publicDir)),
    ...(await collectFiles(path.join(publicDir, "posts"), publicDir)),
  ];

  // Get all imageUrls from DB
  const articles = await db
    .select({ imageUrl: newsArticles.imageUrl })
    .from(newsArticles);
  const usedPaths = new Set(
    articles.map((a) => a.imageUrl).filter(Boolean) as string[],
  );

  return allFiles
    .filter((f) => !usedPaths.has(f.relativePath))
    .map((f) => ({
      filePath: f.fullPath,
      relativePath: f.relativePath,
      size: f.size,
    }));
}

export async function deleteOrphanMedia(
  paths: string[],
): Promise<{ deleted: number }> {
  await requireAdmin();
  let deleted = 0;
  const publicDir = path.join(process.cwd(), "public");

  for (const relativePath of paths) {
    // Validate the path is within public/images/posts or public/posts
    const fullPath = path.join(publicDir, relativePath);
    const resolved = path.resolve(fullPath);
    const allowedPrefixes = [
      path.resolve(path.join(publicDir, "images", "posts")),
      path.resolve(path.join(publicDir, "posts")),
    ];
    if (!allowedPrefixes.some((prefix) => resolved.startsWith(`${prefix}/`))) {
      continue;
    }
    try {
      await rm(resolved);
      deleted++;
    } catch {
      // file already gone
    }
  }

  return { deleted };
}
