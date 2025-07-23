// import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { hashPassword, generateSalt } from "@/lib/password";

const salt = generateSalt();
const password = await hashPassword("agrocomm", salt);

async function main() {
  const newUser: typeof users.$inferInsert = {
    email: "agrocomm@agrocomm.com.br",
    password,
    salt,
    role: "admin",
  };

  const [user] = await db.insert(users).values(newUser).onConflictDoNothing().returning();
  if (!user) return console.log("User already exists"); 
  
  console.log("User created:", user.id);

  const profile: typeof profiles.$inferInsert = {
    userId: user.id,
    name: "AgroComm",
    username: "agrocomm",
  };
  
  const [newProfile] = await db.insert(profiles).values(profile).onConflictDoNothing().returning();
  if (!newProfile) return console.log("Profile already exists");

  console.log("Profile created:", newProfile.id);
}

main();
