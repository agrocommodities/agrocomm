// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken, getTokenExpiry } from "@/lib/tokens";

const MAX_RESEND_ATTEMPTS = 10;
const RESEND_COOLDOWN_MINUTES = 2; // Cooldown entre reenvios

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Por segurança, não revelar se email existe
      return NextResponse.json({ 
        success: true, 
        message: "Se o email existir, um novo código será enviado." 
      });
    }

    // Verificar se email já está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Este email já foi verificado" },
        { status: 400 }
      );
    }

    // ✅ Verificar se usuário está bloqueado
    if (user.emailResendBlocked) {
      return NextResponse.json(
        { error: "Limite de reenvios excedido. Entre em contato com o suporte." },
        { status: 429 }
      );
    }

    // ✅ Verificar limite de tentativas
    const currentCount = user.emailResendCount || 0;
    if (currentCount >= MAX_RESEND_ATTEMPTS) {
      // Bloquear usuário
      await db.update(users).set({
        emailResendBlocked: true,
        updatedAt: new Date().toISOString(),
      }).where(eq(users.id, user.id));

      return NextResponse.json(
        { error: `Limite de ${MAX_RESEND_ATTEMPTS} reenvios excedido. Conta bloqueada.` },
        { status: 429 }
      );
    }

    // ✅ Verificar cooldown
    if (user.emailLastResent) {
      const lastResent = new Date(user.emailLastResent);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastResent.getTime()) / (1000 * 60);
      
      if (diffMinutes < RESEND_COOLDOWN_MINUTES) {
        const remainingTime = Math.ceil(RESEND_COOLDOWN_MINUTES - diffMinutes);
        return NextResponse.json(
          { error: `Aguarde ${remainingTime} minuto(s) antes de reenviar` },
          { status: 429 }
        );
      }
    }

    // ✅ Verificar se token atual ainda é válido
    let verificationToken = user.emailVerificationToken;
    let verificationExpires = user.emailVerificationExpires;
    let shouldGenerateNewToken = true;

    if (verificationToken && verificationExpires) {
      const expiryDate = new Date(verificationExpires);
      const now = new Date();
      
      // Se token ainda válido por mais de 1 hora, reusar
      if (expiryDate.getTime() > now.getTime() + (60 * 60 * 1000)) {
        shouldGenerateNewToken = false;
        console.log("♻️ Reusando token válido existente");
      }
    }

    // Gerar novo token se necessário
    if (shouldGenerateNewToken) {
      verificationToken = generateVerificationToken();
      verificationExpires = getTokenExpiry().toISOString();
      console.log("🔄 Gerando novo token");
    }

    // ✅ Atualizar contadores e dados
    await db.update(users).set({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      emailResendCount: currentCount + 1,
      emailLastResent: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(users.id, user.id));

    // Enviar email
    const emailSent = await sendVerificationEmail(email, verificationToken!);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    console.log(`✅ Email reenviado para ${email} (tentativa ${currentCount + 1}/${MAX_RESEND_ATTEMPTS})`);

    return NextResponse.json({ 
      success: true,
      message: "Código reenviado com sucesso!",
      attemptsRemaining: MAX_RESEND_ATTEMPTS - (currentCount + 1),
      totalAttempts: currentCount + 1,
      maxAttempts: MAX_RESEND_ATTEMPTS
    });

  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}