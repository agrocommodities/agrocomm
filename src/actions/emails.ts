"use server";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { emailTemplateConfigs, subscriptionAlerts, users } from "@/db/schema";
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
