"use server";

import { db } from "@/db";
import {
  whatsappSubscribers,
  whatsappSubscriberProducts,
  whatsappLogs,
  users,
  subscriptions,
  subscriptionPlans,
  userQuoteSubscriptions,
  products,
  quotes,
  cities,
  states,
} from "@/db/schema";
import { eq, desc, and, inArray, sql, count } from "drizzle-orm";
import { getSession, getUserPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import {
  sendWhatsAppBulletinTemplate,
  formatQuotesBulletinBody,
} from "@/lib/whatsapp";

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
async function _sendQuotesToSubscriber(sub: {
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
  const message = formatQuotesBulletinBody(uniqueQuotes);
  const result = await sendWhatsAppBulletinTemplate(
    sub.phone,
    sub.name,
    date,
    message,
  );

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

async function sendQuotesToUser(user: {
  userId: number;
  name: string;
  phone: string;
}) {
  const followed = await db
    .select({
      productId: userQuoteSubscriptions.productId,
      productName: products.name,
      unit: products.unit,
      cityId: userQuoteSubscriptions.cityId,
      cityName: cities.name,
      stateCode: states.code,
    })
    .from(userQuoteSubscriptions)
    .innerJoin(products, eq(userQuoteSubscriptions.productId, products.id))
    .leftJoin(cities, eq(userQuoteSubscriptions.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(
      and(
        eq(userQuoteSubscriptions.userId, user.userId),
        eq(userQuoteSubscriptions.notifyWhatsapp, 1),
      ),
    );

  if (followed.length === 0) {
    return { success: false, error: "Nenhuma cotação assinada" };
  }

  const quotesData: Array<{
    productName: string;
    unit: string;
    city: string;
    state: string;
    price: number;
    variation: number | null;
    quoteDate: string;
  }> = [];

  for (const f of followed) {
    const conditions = [eq(quotes.productId, f.productId)];
    if (f.cityId) {
      conditions.push(eq(quotes.cityId, f.cityId));
    }

    const [latestQuote] = await db
      .select({
        price: quotes.price,
        variation: quotes.variation,
        quoteDate: quotes.quoteDate,
        cityName: cities.name,
        stateCode: states.code,
      })
      .from(quotes)
      .innerJoin(cities, eq(quotes.cityId, cities.id))
      .innerJoin(states, eq(cities.stateId, states.id))
      .where(and(...conditions))
      .orderBy(desc(quotes.quoteDate), desc(quotes.createdAt))
      .limit(1);

    if (!latestQuote) {
      continue;
    }

    quotesData.push({
      productName: f.productName,
      unit: f.unit,
      city: latestQuote.cityName ?? f.cityName ?? "Todas",
      state: latestQuote.stateCode ?? f.stateCode ?? "",
      price: latestQuote.price,
      variation: latestQuote.variation,
      quoteDate: latestQuote.quoteDate,
    });
  }

  if (quotesData.length === 0) {
    return { success: false, error: "Nenhuma cotação disponível" };
  }

  const latestDate = [...quotesData].sort((a, b) =>
    b.quoteDate.localeCompare(a.quoteDate),
  )[0].quoteDate;
  const bulletinBody = formatQuotesBulletinBody(quotesData);
  const result = await sendWhatsAppBulletinTemplate(
    user.phone,
    user.name,
    latestDate,
    bulletinBody,
  );

  await db.insert(whatsappLogs).values({
    subscriberId: null,
    phone: user.phone,
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
 * Dispara o envio em segundo plano (via after()) para não bloquear a
 * resposta da server action — o envio respeita o intervalo entre
 * mensagens e pode levar minutos para todos os assinantes.
 * Acompanhe o progresso em "Histórico de Envios".
 */
export async function sendManualSubscribersQuotes() {
  await requireAdmin();

  const activeSubs = await db
    .select()
    .from(whatsappSubscribers)
    .where(eq(whatsappSubscribers.active, 1));

  after(async () => {
    for (const sub of activeSubs) {
      const subProducts = await db
        .select({ productId: whatsappSubscriberProducts.productId })
        .from(whatsappSubscriberProducts)
        .where(eq(whatsappSubscriberProducts.subscriberId, sub.id));

      const productIds = subProducts.map((p) => p.productId);
      await _sendQuotesToSubscriber({
        id: sub.id,
        name: sub.name,
        phone: sub.phone,
        productIds,
      });
    }
  });

  return { total: activeSubs.length, started: true };
}

/**
 * Versão interna sem auth guard (para uso na API route com secret).
 */
export async function sendDailyQuotesInternal() {
  const rawActiveUsers = await db
    .select({
      userId: users.id,
      name: users.name,
      phone: users.phoneE164,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptionPlans.emailBulletins, 1),
        eq(users.bulletinOptOut, 0),
        sql`${users.phoneVerifiedAt} is not null`,
        sql`${users.phoneE164} is not null`,
      ),
    );

  const activeUsers = Array.from(
    new Map(
      rawActiveUsers
        .filter(
          (user): user is { userId: number; name: string; phone: string } =>
            Boolean(user.phone),
        )
        .map((user) => [user.userId, user]),
    ).values(),
  );

  const results: Array<{
    phone: string;
    name: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const user of activeUsers) {
    const result = await sendQuotesToUser(user);

    results.push({
      phone: user.phone ?? "",
      name: user.name,
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
