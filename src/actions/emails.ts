"use server";

import { eq, desc, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  bulletinSchedules,
  emailTemplateConfigs,
  newsArticles,
  products,
  quotes,
  cities,
  states,
  subscriptionAlerts,
  subscriptions,
  subscriptionPlans,
  users,
} from "@/db/schema";
import { getSession, getUserPermissions } from "@/lib/auth";
import nodemailer from "nodemailer";
import {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendSubscriptionWelcomeEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
  sendQuoteBulletinEmail,
  sendNewsBulletinEmail,
  sendPixPaymentEmail,
  sendBoletoPaymentEmail,
} from "@/lib/email";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");
  const perms = await getUserPermissions(session.userId);
  if (!perms.has("admin.access")) throw new Error("Sem permissão");
  return session;
}

// ── SMTP status ───────────────────────────────────────────────────────────────

export async function getEmailConfig() {
  await requireAdmin();
  return {
    configured: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
    from: process.env.MAIL_ADDR ?? null,
    user: process.env.MAIL_USER ?? null,
  };
}

export async function sendTestEmailAction(to: string) {
  await requireAdmin();

  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const from = process.env.MAIL_ADDR;

  if (!user || !pass || !from) {
    return { error: "SMTP não configurado (MAIL_USER, MAIL_PASS, MAIL_ADDR)." };
  }

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "E-mail inválido." };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "iCloud",
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"AgroComm" <${from}>`,
      to,
      subject: "AgroComm — Teste de e-mail",
      text: "Este é um e-mail de teste enviado pelo painel administrativo do AgroComm.",
      html: "<p>Este é um <strong>e-mail de teste</strong> enviado pelo painel administrativo do AgroComm.</p>",
    });

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail.",
    };
  }
}

// ── Per-template test emails ─────────────────────────────────────────────────

export async function sendTemplateTestEmailAction(
  templateKey: string,
  to: string,
) {
  await requireAdmin();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "E-mail inválido." };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  try {
    switch (templateKey) {
      case "password-reset":
        await sendPasswordResetEmail(to, "Usuário Teste", "token-de-teste-123");
        break;
      case "email-verification":
        await sendEmailVerificationEmail(
          to,
          "Usuário Teste",
          "token-de-verificacao-123",
        );
        break;
      case "subscription-welcome":
        await sendSubscriptionWelcomeEmail(to, "Usuário Teste", "Profissional");
        break;
      case "payment-success":
        await sendPaymentSuccessEmail(to, "Usuário Teste", 99.9, "credit_card");
        break;
      case "payment-failed":
        await sendPaymentFailedEmail(to, "Usuário Teste", "Profissional");
        break;
      case "subscription-expiring":
        await sendSubscriptionExpiringEmail(
          to,
          "Usuário Teste",
          "Profissional",
          3,
        );
        break;
      case "subscription-expired":
        await sendSubscriptionExpiredEmail(to, "Usuário Teste", "Profissional");
        break;
      case "quote-bulletin":
        await sendQuoteBulletinEmail(to, "Usuário Teste", [
          {
            productName: "Soja",
            cityName: "Campinas",
            stateName: "SP",
            price: 145.5,
            variation: 1.2,
          },
          {
            productName: "Milho",
            cityName: "Ribeirão Preto",
            stateName: "SP",
            price: 72.3,
            variation: -0.5,
          },
          {
            productName: "Boi Gordo",
            cityName: "Barretos",
            stateName: "SP",
            price: 285.0,
            variation: 0.8,
          },
        ]);
        break;
      case "news-bulletin":
        await sendNewsBulletinEmail(to, "Usuário Teste", [
          {
            title: "Soja atinge recorde histórico nas bolsas internacionais",
            excerpt:
              "O contrato futuro de soja na CBOT fechou em alta de 2,3% nesta quinta-feira, impulsionado pela demanda chinesa.",
            url: `${appUrl}/noticias/soja-recorde`,
            imageUrl: null,
          },
          {
            title:
              "Previsão de chuvas favorece plantio de milho no Centro-Oeste",
            excerpt:
              "Meteorologistas indicam chuvas regulares nas próximas semanas, beneficiando o plantio da segunda safra de milho.",
            url: `${appUrl}/noticias/milho-plantio`,
            imageUrl: null,
          },
        ]);
        break;
      case "pix-payment":
        await sendPixPaymentEmail(
          to,
          "Usuário Teste",
          99.9,
          "",
          "00020126580014br.gov.bcb.pix0136exemplo-chave-pix-teste",
        );
        break;
      case "boleto-payment":
        await sendBoletoPaymentEmail(
          to,
          "Usuário Teste",
          99.9,
          `${appUrl}/boleto/teste`,
        );
        break;
      default:
        return { error: `Template desconhecido: ${templateKey}` };
    }
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao enviar e-mail.",
    };
  }
}

// ── Template configs ──────────────────────────────────────────────────────────

export async function getEmailTemplateConfigs() {
  await requireAdmin();
  return db
    .select()
    .from(emailTemplateConfigs)
    .orderBy(emailTemplateConfigs.templateKey);
}

export async function saveEmailTemplateConfigAction(
  templateKey: string,
  subject: string,
  bodyMarkdown: string,
) {
  await requireAdmin();

  if (!templateKey.trim()) return { error: "Chave inválida." };

  const existing = await db
    .select({ id: emailTemplateConfigs.id })
    .from(emailTemplateConfigs)
    .where(eq(emailTemplateConfigs.templateKey, templateKey))
    .limit(1);

  const now = new Date().toISOString();

  if (existing.length > 0) {
    await db
      .update(emailTemplateConfigs)
      .set({
        subject: subject || null,
        bodyMarkdown: bodyMarkdown || null,
        updatedAt: now,
      })
      .where(eq(emailTemplateConfigs.templateKey, templateKey));
  } else {
    await db.insert(emailTemplateConfigs).values({
      templateKey,
      subject: subject || null,
      bodyMarkdown: bodyMarkdown || null,
      updatedAt: now,
    });
  }

  return { success: true };
}

export async function deleteEmailTemplateConfigAction(id: number) {
  await requireAdmin();
  await db.delete(emailTemplateConfigs).where(eq(emailTemplateConfigs.id, id));
  return { success: true };
}

// ── Alert logs ────────────────────────────────────────────────────────────────

export interface EmailAlertLogRow {
  id: number;
  alertType: string;
  status: string;
  sentAt: string;
  userName: string;
  userEmail: string;
}

export async function getEmailAlertLogs(): Promise<EmailAlertLogRow[]> {
  await requireAdmin();

  const rows = await db
    .select({
      id: subscriptionAlerts.id,
      alertType: subscriptionAlerts.alertType,
      status: subscriptionAlerts.status,
      sentAt: subscriptionAlerts.sentAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(subscriptionAlerts)
    .innerJoin(users, eq(subscriptionAlerts.userId, users.id))
    .orderBy(desc(subscriptionAlerts.sentAt))
    .limit(100);

  return rows;
}

// ── Agenda de Boletins ────────────────────────────────────────────────────────

export interface BulletinSchedule {
  id: number;
  bulletinType: string;
  enabled: number;
  daysOfWeek: number[];
  sendTimes: number[];
  lastSentAt: string | null;
  updatedAt: string;
}

export async function getBulletinSchedules(): Promise<BulletinSchedule[]> {
  await requireAdmin();
  const rows = await db.select().from(bulletinSchedules);
  return rows.map((r) => ({
    ...r,
    daysOfWeek: JSON.parse(r.daysOfWeek) as number[],
    sendTimes: JSON.parse(r.sendTimes) as number[],
  }));
}

export async function saveBulletinScheduleAction(
  bulletinType: string,
  enabled: boolean,
  daysOfWeek: number[],
  sendTimes: number[],
) {
  await requireAdmin();

  if (!["news", "quotes"].includes(bulletinType))
    return { error: "Tipo inválido." };

  const now = new Date().toISOString();
  const existing = await db
    .select({ id: bulletinSchedules.id })
    .from(bulletinSchedules)
    .where(eq(bulletinSchedules.bulletinType, bulletinType))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(bulletinSchedules)
      .set({
        enabled: enabled ? 1 : 0,
        daysOfWeek: JSON.stringify(daysOfWeek),
        sendTimes: JSON.stringify(sendTimes),
        updatedAt: now,
      })
      .where(eq(bulletinSchedules.bulletinType, bulletinType));
  } else {
    await db.insert(bulletinSchedules).values({
      bulletinType,
      enabled: enabled ? 1 : 0,
      daysOfWeek: JSON.stringify(daysOfWeek),
      sendTimes: JSON.stringify(sendTimes),
      updatedAt: now,
    });
  }

  return { success: true };
}

export async function sendNewsBulletinNowAction(to: string) {
  await requireAdmin();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    return { error: "E-mail inválido." };

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const articles = await db
    .select({
      title: newsArticles.title,
      excerpt: newsArticles.excerpt,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
    })
    .from(newsArticles)
    .where(gte(newsArticles.publishedAt, yesterday.toISOString()))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(5);

  if (articles.length === 0)
    return { error: "Nenhuma notícia nas últimas 24h." };

  const formattedArticles = articles.map((a) => ({
    title: a.title,
    excerpt: a.excerpt,
    url: `${appUrl}/noticias/${a.slug}`,
    imageUrl: a.imageUrl,
  }));

  try {
    await sendNewsBulletinEmail(to, "Administrador", formattedArticles);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar." };
  }
}

export async function sendQuotesBulletinNowAction(to: string) {
  await requireAdmin();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    return { error: "E-mail inválido." };

  const today = new Date().toISOString().slice(0, 10);

  const recentQuotes = await db
    .select({
      productName: products.name,
      cityName: cities.name,
      stateName: states.name,
      price: quotes.price,
      variation: quotes.variation,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .leftJoin(cities, eq(quotes.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(eq(quotes.quoteDate, today))
    .orderBy(desc(quotes.createdAt))
    .limit(10);

  if (recentQuotes.length === 0)
    return { error: "Nenhuma cotação disponível para hoje." };

  const formatted = recentQuotes.map((q) => ({
    productName: q.productName,
    cityName: q.cityName ?? "Todas",
    stateName: q.stateName ?? "",
    price: q.price,
    variation: q.variation,
  }));

  try {
    await sendQuoteBulletinEmail(to, "Administrador", formatted);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar." };
  }
}

// ── Destinatários de Boletins ─────────────────────────────────────────────────

export interface BulletinRecipientRow {
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  subscriptionStatus: string;
  bulletinOptOut: number;
}

export async function getBulletinRecipients(): Promise<BulletinRecipientRow[]> {
  await requireAdmin();

  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      planName: subscriptionPlans.name,
      subscriptionStatus: subscriptions.status,
      bulletinOptOut: users.bulletinOptOut,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(eq(subscriptionPlans.emailBulletins, 1))
    .orderBy(users.name);

  return rows;
}

export async function toggleBulletinOptOut(userId: number, optOut: boolean) {
  await requireAdmin();
  await db
    .update(users)
    .set({ bulletinOptOut: optOut ? 1 : 0 })
    .where(eq(users.id, userId));
  return { success: true };
}
