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
  const logoUrl = `${appUrl}/images/logo.svg`;

  await emailClient.send({
    template: "password-reset",
    message: { to },
    locals: {
      userName,
      resetUrl,
      logoUrl,
      expiresInMinutes: 30,
    },
  });
}
