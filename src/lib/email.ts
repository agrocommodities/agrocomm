import nodemailer from "nodemailer";
import Email from "email-templates";

const transporters = {
  iCloud: nodemailer.createTransport({
    service: "iCloud",
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  }),
  Gmail: nodemailer.createTransport({
    service: "Gmail",
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  }),
};

export function sendVerificationEmail(emailAddress: string, token: string, provider: string = "iCloud") {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verificar-email?token=${token}`;
  const selectedTransporter = provider === "Gmail" ? transporters.Gmail : transporters.iCloud;

  // Criar uma nova instância de Email com o transportador selecionado
  const emailInstance = new Email({
    message: {
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.EMAIL_FROM}>`
    },
    send: true,
    transport: selectedTransporter,
  });

  try {
    const result = emailInstance.send({
      template: "verification",
      message: {
        to: emailAddress
      },
      locals: {
        appName: process.env.NEXT_PUBLIC_APP_NAME,
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