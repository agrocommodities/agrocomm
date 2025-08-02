import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, generateSalt } from "@/lib/password";
  
const salt = generateSalt();
const password = await hashPassword("agrocomm", salt);

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

main();

