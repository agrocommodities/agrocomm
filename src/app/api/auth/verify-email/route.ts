// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createSession, getUserFromSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const cookieStore = await cookies();
    
    // Buscar usuário pelo token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.emailVerificationToken, token),
        sql`${users.emailVerificationExpires} > datetime('now')`
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // ✅ ESTRATÉGIA: Verificar se há sessão ativa do mesmo usuário
    const currentSession = await getUserFromSession(cookieStore);
    const shouldAutoLogin = currentSession?.id === user.id;

    // Atualizar usuário como verificado
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // 🎯 Auto-login apenas se sessão ativa do mesmo usuário
    if (shouldAutoLogin) {
      // Renovar sessão para segurança
      await createSession(
        { id: user.id, email: user.email, role: user.role },
        cookieStore
      );
      
      return NextResponse.json({ 
        success: true, 
        autoLogin: true,
        message: "Email verificado e login realizado!" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      autoLogin: false,
      message: "Email verificado! Faça login para continuar." 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar email" },
      { status: 500 }
    );
  }
}