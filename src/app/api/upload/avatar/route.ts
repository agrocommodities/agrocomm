import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    
    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único para o arquivo
    const filename = `avatar-${user.id}-${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(process.cwd(), "public/uploads/avatars", filename);
    
    await writeFile(filepath, buffer);
    
    // Atualizar o avatar no banco
    await db
      .update(profiles)
      .set({
        avatar: `/uploads/avatars/${filename}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.userId, user.id));

    return NextResponse.json({ 
      success: true, 
      avatar: `/uploads/avatars/${filename}` 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do avatar" }, 
      { status: 500 }
    );
  }
}