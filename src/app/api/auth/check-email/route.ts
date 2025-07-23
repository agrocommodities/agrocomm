// src/app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao verificar email" },
      { status: 500 }
    );
  }
}