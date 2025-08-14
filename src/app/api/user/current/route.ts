// src/app/api/user/current/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}