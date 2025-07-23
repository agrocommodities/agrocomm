import nodemailer from "nodemailer";
import Email from "email-templates";
import path from "path";

// Configuração única do transporter
const transporter = nodemailer.createTransport({
  service: "iCloud", // ou iCloud
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function sendVerificationEmail(emailAddress: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}`;
  
  // Configuração correta do email-templates
  const email = new Email({
    message: {
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.EMAIL_FROM}>`
    },
    send: true,
    preview: false, // ⚠️ IMPORTANTE: preview: false em produção
    transport: transporter,
    views: {
      root: path.join(process.cwd(), 'emails'), // ⚠️ Caminho absoluto
      options: {
        extension: 'pug' // ⚠️ Especificar extensão
      }
    }
  });

  try {
    const result = email.send({
      template: 'verification', // ⚠️ Nome da pasta do template
      message: {
        to: emailAddress
      },
      locals: {
        appName: process.env.NEXT_PUBLIC_APP_NAME,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        verificationUrl,
        token,
        year: new Date().getFullYear()
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return null;
  }
}