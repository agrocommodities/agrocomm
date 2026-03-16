"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    return { error: "Todos os campos são obrigatórios." };
  }

  if (
    name.length > 100 ||
    email.length > 200 ||
    subject.length > 200 ||
    message.length > 5000
  ) {
    return { error: "Um ou mais campos excedem o tamanho máximo permitido." };
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail inválido." };
  }

  try {
    // Save to database
    await db.insert(contactMessages).values({
      name,
      email,
      subject,
      message,
    });

    // Send email notification if Nodemailer is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (smtpHost && smtpUser && smtpPass && contactEmail) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from: `"AgroComm" <${smtpUser}>`,
          to: contactEmail,
          replyTo: email,
          subject: `[AgroComm Suporte] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #394634; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">Nova mensagem de contato</h2>
              </div>
              <div style="background: #f9f9f9; padding: 20px; border: 1px solid #eee; border-radius: 0 0 8px 8px;">
                <p><strong>Nome:</strong> ${name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                <p><strong>E-mail:</strong> ${email.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                <p><strong>Assunto:</strong> ${subject.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
                <p><strong>Mensagem:</strong></p>
                <p style="white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>
            </div>
          `,
        });
      } catch {
        // Email sending failed but form was saved — don't fail the request
      }
    }

    return { success: true };
  } catch {
    return { error: "Erro ao enviar mensagem. Tente novamente." };
  }
}
