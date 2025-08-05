import { db } from "@/db";
import { users, commodities } from "@/db/schema";
import { hashPassword, generateSalt } from "@/lib/password";
  
const commodityList = [
  { name: "Soja", slug: "soja", unit: "saca 60kg" },
  { name: "Milho", slug: "milho", unit: "saca 60kg" },
  { name: "Arroba da Vaca", slug: "arroba-vaca", unit: "arroba" },
  { name: "Arroba do Boi", slug: "arroba-boi", unit: "arroba" },
];

const salt = generateSalt();
const password = await hashPassword("agrocomm", salt);

async function seedCommodities() {
  console.log("Inserindo commodities...");
  
  for (const commodity of commodityList) {
    try {
      await db.insert(commodities).values(commodity).onConflictDoNothing();
      console.log(`✓ ${commodity.name} inserida`);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log(`- ${commodity.name} já existe`);
      } else {
        console.error(`✗ Erro ao inserir ${commodity.name}:`, error);
      }
    }
  }
  // console.log("Processo concluído!");
}

async function main() {
  const user: typeof users.$inferInsert = {
    name: "Agrocomm Admin",
    email: "agrocomm@agrocomm.com.br",
    password,
    salt,
    role: "admin",
  };

  await db.insert(users).values(user).onConflictDoNothing().returning();
}

seedCommodities();
main();

