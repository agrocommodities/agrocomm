// src/lib/email.ts
import nodemailer from 'nodemailer';
import { generateVerificationToken } from './tokens';

// Configurar transporter (exemplo com Gmail - ajuste conforme seu provedor)
const transporter = nodemailer.createTransport({
  service: "iCloud", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Confirme seu email - AgroComm',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bem-vindo ao AgroComm!</h2>
        <p>Para completar seu cadastro, por favor confirme seu email clicando no link abaixo:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #394634; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Confirmar Email
        </a>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>Este link expira em 24 horas.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">Se você não criou uma conta no AgroComm, ignore este email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}