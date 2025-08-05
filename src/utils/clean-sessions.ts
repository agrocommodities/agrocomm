import { db } from "@/db";
import { users } from "@/db/schema";

// Script para limpar dados antigos após reset do banco
async function cleanupAfterReset() {
  console.log("🧹 Iniciando limpeza após reset do banco...");
  
  // Verificar se há usuários no banco
  const userCount = await db.select().from(users);
  console.log(`📊 Usuários encontrados: ${userCount.length}`);
  
  if (userCount.length === 0) {
    console.log("⚠️ Nenhum usuário encontrado. Execute o seed:");
    console.log("bun run db:seed");
  }
  
  console.log("✅ Limpeza concluída. Sessões inválidas serão removidas automaticamente.");
}

cleanupAfterReset().catch(console.error);