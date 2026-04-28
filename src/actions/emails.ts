"use server";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { emailTemplateConfigs, subscriptionAlerts, users } from "@/db/schema";
import { getSession, getUserPermissions } from "@/lib/auth";
import nodemailer from "nodemailer";

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
