import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { hashPassword, generateSalt } from "@/lib/password";

const salt = generateSalt();
const password = await hashPassword("agrocomm", salt);

async function main() {
  const user: typeof users.$inferInsert = {
    email: "agrocomm@agrocomm.com.br",
    password,
    salt,
    role: "admin",
  };

  if (!user) return 
  
  const profile: typeof profiles.$inferInsert = {
    userId: (await db.query.users.findMany({ where: eq(users.email, user.email) }))[0]?.id,
    name: "AgroComm",
    username: "agrocomm",
  };

  await db.insert(users).values(user).onConflictDoNothing();
  await db.insert(profiles).values(profile).onConflictDoNothing();
}

main();
