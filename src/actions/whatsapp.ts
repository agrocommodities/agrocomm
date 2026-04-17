"use server";

import { db } from "@/db";
import {
  whatsappSubscribers,
  whatsappSubscriberProducts,
  whatsappLogs,
  products,
  quotes,
  cities,
  states,
} from "@/db/schema";
import { eq, desc, and, inArray, sql, count } from "drizzle-orm";
import { getSession, getUserPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendWhatsAppText, formatQuotesMessage } from "@/lib/whatsapp";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/");
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) redirect("/");
  return session;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type WhatsAppSubscriber = {
  id: number;
  name: string;
  phone: string;
  active: number;
  createdAt: string;
  products: Array<{ id: number; name: string; slug: string; category: string }>;
};

export type WhatsAppLogEntry = {
  id: number;
  phone: string;
  subscriberName: string | null;
  status: string;
  messageId: string | null;
  errorMessage: string | null;
  sentAt: string;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getWhatsAppSubscribers(): Promise<WhatsAppSubscriber[]> {
  await requireAdmin();

  const subs = await db
    .select()
    .from(whatsappSubscribers)
    .orderBy(desc(whatsappSubscribers.createdAt));

  const result: WhatsAppSubscriber[] = [];

  for (const sub of subs) {
    const subProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        category: products.category,
      })
      .from(whatsappSubscriberProducts)
      .innerJoin(
        products,
        eq(whatsappSubscriberProducts.productId, products.id),
      )
      .where(eq(whatsappSubscriberProducts.subscriberId, sub.id));

    result.push({ ...sub, products: subProducts });
  }

  return result;
}

export async function getWhatsAppLogs(): Promise<WhatsAppLogEntry[]> {
  await requireAdmin();

  return db
    .select({
      id: whatsappLogs.id,
      phone: whatsappLogs.phone,
      subscriberName: whatsappSubscribers.name,
      status: whatsappLogs.status,
      messageId: whatsappLogs.messageId,
      errorMessage: whatsappLogs.errorMessage,
      sentAt: whatsappLogs.sentAt,
    })
    .from(whatsappLogs)
    .leftJoin(
      whatsappSubscribers,
      eq(whatsappLogs.subscriberId, whatsappSubscribers.id),
    )
    .orderBy(desc(whatsappLogs.sentAt))
    .limit(100);
}

export async function getAllProducts() {
  await requireAdmin();
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      category: products.category,
      unit: products.unit,
    })
    .from(products)
    .orderBy(products.category, products.name);
}

export async function getWhatsAppStats() {
  await requireAdmin();

  const [totalSubs] = await db
    .select({ count: count() })
    .from(whatsappSubscribers);
  const [activeSubs] = await db
    .select({ count: count() })
    .from(whatsappSubscribers)
    .where(eq(whatsappSubscribers.active, 1));

  const today = new Date().toISOString().slice(0, 10);
  const [todaySent] = await db
    .select({ count: count() })
    .from(whatsappLogs)
    .where(sql`date(${whatsappLogs.sentAt}) = ${today}`);
  const [todayErrors] = await db
    .select({ count: count() })
    .from(whatsappLogs)
    .where(
      and(
        sql`date(${whatsappLogs.sentAt}) = ${today}`,
        eq(whatsappLogs.status, "error"),
      ),
    );

  return {
    totalSubscribers: totalSubs.count,
    activeSubscribers: activeSubs.count,
    todaySent: todaySent.count,
    todayErrors: todayErrors.count,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createSubscriber(
  name: string,
  phone: string,
  productIds: number[],
) {
  await requireAdmin();

  // Normaliza telefone (remove tudo que não é dígito)
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { error: "Telefone inválido" };
  }

  const existing = await db
    .select({ id: whatsappSubscribers.id })
    .from(whatsappSubscribers)
    .where(eq(whatsappSubscribers.phone, cleanPhone))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Este telefone já está cadastrado" };
  }

  const [sub] = await db
    .insert(whatsappSubscribers)
    .values({ name, phone: cleanPhone })
    .returning({ id: whatsappSubscribers.id });

  if (productIds.length > 0) {
    await db.insert(whatsappSubscriberProducts).values(
      productIds.map((productId) => ({
        subscriberId: sub.id,
        productId,
      })),
    );
  }

  return { success: true, id: sub.id };
}

export async function updateSubscriber(
  id: number,
  name: string,
  phone: string,
  productIds: number[],
) {
  await requireAdmin();

  const cleanPhone = phone.replace(/\D/g, "");

  // Verifica duplicata (excluindo o próprio)
  const existing = await db
    .select({ id: whatsappSubscribers.id })
    .from(whatsappSubscribers)
    .where(
      and(
        eq(whatsappSubscribers.phone, cleanPhone),
        sql`${whatsappSubscribers.id} != ${id}`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "Este telefone já está cadastrado" };
  }

  await db
    .update(whatsappSubscribers)
    .set({ name, phone: cleanPhone })
    .where(eq(whatsappSubscribers.id, id));

  // Recria produtos selecionados
  await db
    .delete(whatsappSubscriberProducts)
    .where(eq(whatsappSubscriberProducts.subscriberId, id));

  if (productIds.length > 0) {
    await db.insert(whatsappSubscriberProducts).values(
      productIds.map((productId) => ({
        subscriberId: id,
        productId,
      })),
    );
  }

  return { success: true };
}

export async function toggleSubscriber(id: number) {
  await requireAdmin();

  const [sub] = await db
    .select({ active: whatsappSubscribers.active })
    .from(whatsappSubscribers)
    .where(eq(whatsappSubscribers.id, id));

  if (!sub) return { error: "Assinante não encontrado" };

  await db
    .update(whatsappSubscribers)
    .set({ active: sub.active === 1 ? 0 : 1 })
    .where(eq(whatsappSubscribers.id, id));

  return { success: true };
}

export async function deleteSubscriber(id: number) {
  await requireAdmin();
  await db.delete(whatsappSubscribers).where(eq(whatsappSubscribers.id, id));
  return { success: true };
}

// ── Envio de cotações ─────────────────────────────────────────────────────────

/**
 * Busca as cotações mais recentes para os produtos de um assinante
 * e envia via WhatsApp.
 */
async function sendQuotesToSubscriber(sub: {
  id: number;
  name: string;
  phone: string;
  productIds: number[];
}) {
  if (sub.productIds.length === 0) {
    return { success: false, error: "Nenhum produto selecionado" };
  }

  // Busca a cotação mais recente de cada produto (1 por produto, qualquer cidade)
  const latestQuotes = await db
    .select({
      productName: products.name,
      unit: products.unit,
      city: cities.name,
      state: states.code,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(inArray(quotes.productId, sub.productIds))
    .orderBy(desc(quotes.quoteDate), products.name)
    .limit(sub.productIds.length * 5); // Múltiplas cidades por produto

  if (latestQuotes.length === 0) {
    return { success: false, error: "Nenhuma cotação disponível" };
  }

  // Pega apenas a cotação mais recente por produto (primeira ocorrência)
  const seen = new Set<string>();
  const uniqueQuotes = latestQuotes.filter((q) => {
    if (seen.has(q.productName)) return false;
    seen.add(q.productName);
    return true;
  });

  const date = uniqueQuotes[0].quoteDate;
  const message = formatQuotesMessage(sub.name, uniqueQuotes, date);
  const result = await sendWhatsAppText(sub.phone, message);

  // Registra log
  await db.insert(whatsappLogs).values({
    subscriberId: sub.id,
    phone: sub.phone,
    status: result.success ? "success" : "error",
    messageId: result.messageId ?? null,
    errorMessage: result.error ?? null,
  });

  return result;
}

/**
 * Envia cotações para TODOS os assinantes ativos.
 * Chamado pelo cron diário ou manualmente pelo admin.
 */
export async function sendDailyQuotes() {
  await requireAdmin();
  return sendDailyQuotesInternal();
}

/**
 * Versão interna sem auth guard (para uso na API route com secret).
 */
export async function sendDailyQuotesInternal() {
  const activeSubs = await db
    .select()
    .from(whatsappSubscribers)
    .where(eq(whatsappSubscribers.active, 1));

  const results: Array<{
    phone: string;
    name: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const sub of activeSubs) {
    const subProducts = await db
      .select({ productId: whatsappSubscriberProducts.productId })
      .from(whatsappSubscriberProducts)
      .where(eq(whatsappSubscriberProducts.subscriberId, sub.id));

    const productIds = subProducts.map((p) => p.productId);
    const result = await sendQuotesToSubscriber({
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      productIds,
    });

    results.push({
      phone: sub.phone,
      name: sub.name,
      success: result.success,
      error: result.error,
    });
  }

  return {
    total: results.length,
    success: results.filter((r) => r.success).length,
    errors: results.filter((r) => !r.success).length,
    details: results,
  };
}
