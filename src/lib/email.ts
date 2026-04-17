import nodemailer from "nodemailer";
import Email from "email-templates";
import path from "node:path";

function getTransporter() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "iCloud",
    secure: false,
    auth: { user, pass },
  });
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

const emailClient = new Email({
  message: {
    from: `"AgroComm" <${process.env.MAIL_ADDR!}>`,
  },
  transport: getTransporter() ?? { jsonTransport: true },
  send: !!process.env.MAIL_USER,
  preview: false,
  views: {
    root: path.resolve(process.cwd(), "src/emails"),
    options: { extension: "pug" },
  },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: { relativeTo: path.resolve(process.cwd(), "src/emails") },
  },
});

export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  token: string,
) {
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/redefinir-senha?token=${token}`;
  const logoUrl = `${appUrl}/images/logo-email.png`;

  await emailClient.send({
    template: "password-reset",
    message: { to },
    locals: {
      userName,
      resetUrl,
      logoUrl,
      expiresInMinutes: 60,
    },
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  userName: string,
  token: string,
) {
  const appUrl = getAppUrl();
  const activationUrl = `${appUrl}/ativar-conta?token=${token}`;
  const logoUrl = `${appUrl}/images/logo.svg`;

  await emailClient.send({
    template: "email-verification",
    message: { to },
    locals: {
      userName,
      activationUrl,
      logoUrl,
      expiresInHours: 24,
    },
  });
}

// ── Subscription Emails ──────────────────────────────────────────────────────

export async function sendSubscriptionWelcomeEmail(
  to: string,
  userName: string,
  planName: string,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "subscription-welcome",
    message: { to },
    locals: {
      userName,
      planName,
      logoUrl: `${appUrl}/images/logo-email.png`,
      appUrl,
    },
  });
}

export async function sendPaymentSuccessEmail(
  to: string,
  userName: string,
  amount: number,
  paymentMethod: string,
) {
  const appUrl = getAppUrl();
  const methodLabels: Record<string, string> = {
    credit_card: "Cartão de crédito",
    debit_card: "Cartão de débito",
    pix: "Pix",
    boleto: "Boleto",
  };
  await emailClient.send({
    template: "payment-success",
    message: { to },
    locals: {
      userName,
      amount: amount.toFixed(2).replace(".", ","),
      paymentMethod: methodLabels[paymentMethod] ?? paymentMethod,
      logoUrl: `${appUrl}/images/logo-email.png`,
    },
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  userName: string,
  planName: string,
  pixQrCode?: string | null,
  boletoUrl?: string | null,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "payment-failed",
    message: { to },
    locals: {
      userName,
      planName,
      logoUrl: `${appUrl}/images/logo-email.png`,
      retryUrl: `${appUrl}/planos`,
    },
  });

  // If there's pix or boleto data, also send specific payment emails
  if (pixQrCode) {
    await sendPixPaymentEmail(to, userName, 0, "", pixQrCode).catch(() => {});
  }
  if (boletoUrl) {
    await sendBoletoPaymentEmail(to, userName, 0, boletoUrl).catch(() => {});
  }
}

export async function sendSubscriptionExpiringEmail(
  to: string,
  userName: string,
  planName: string,
  daysLeft: number,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "subscription-expiring",
    message: { to },
    locals: {
      userName,
      planName,
      daysLeft,
      logoUrl: `${appUrl}/images/logo-email.png`,
      renewUrl: `${appUrl}/planos`,
    },
  });
}

export async function sendSubscriptionExpiredEmail(
  to: string,
  userName: string,
  planName: string,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "subscription-expired",
    message: { to },
    locals: {
      userName,
      planName,
      logoUrl: `${appUrl}/images/logo-email.png`,
      renewUrl: `${appUrl}/planos`,
    },
  });
}

export async function sendQuoteBulletinEmail(
  to: string,
  userName: string,
  quotes: Array<{
    productName: string;
    cityName: string;
    stateName: string;
    price: number;
    variation: number | null;
  }>,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "quote-bulletin",
    message: { to },
    locals: {
      userName,
      quotes: quotes.map((q) => ({
        ...q,
        price: q.price.toFixed(2).replace(".", ","),
        variation: q.variation !== null ? q.variation.toFixed(2) : null,
      })),
      logoUrl: `${appUrl}/images/logo-email.png`,
      settingsUrl: `${appUrl}/ajustes`,
    },
  });
}

export async function sendNewsBulletinEmail(
  to: string,
  userName: string,
  articles: Array<{
    title: string;
    excerpt: string;
    url: string;
    imageUrl: string | null;
  }>,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "news-bulletin",
    message: { to },
    locals: {
      userName,
      articles,
      logoUrl: `${appUrl}/images/logo-email.png`,
    },
  });
}

export async function sendPixPaymentEmail(
  to: string,
  userName: string,
  amount: number,
  qrCodeBase64: string,
  pixCode: string,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "pix-payment",
    message: { to },
    locals: {
      userName,
      amount: amount.toFixed(2).replace(".", ","),
      qrCodeBase64,
      pixCode,
      logoUrl: `${appUrl}/images/logo-email.png`,
    },
  });
}

export async function sendBoletoPaymentEmail(
  to: string,
  userName: string,
  amount: number,
  boletoUrl: string,
) {
  const appUrl = getAppUrl();
  await emailClient.send({
    template: "boleto-payment",
    message: { to },
    locals: {
      userName,
      amount: amount.toFixed(2).replace(".", ","),
      boletoUrl,
      logoUrl: `${appUrl}/images/logo-email.png`,
    },
  });
}
