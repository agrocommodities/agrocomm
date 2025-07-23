// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // Buscar usuário pelo token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.emailVerificationToken, token),
        // Verificar se não expirou
        sql`${users.emailVerificationExpires} > datetime('now')`
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

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

    // Criar sessão automaticamente
    await createSession(
      { id: user.id, email: user.email, role: user.role },
      await cookies()
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar email" },
      { status: 500 }
    );
  }
}