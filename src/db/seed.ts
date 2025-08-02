import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
  
const db = drizzle(process.env.DB_FILE_NAME!);

async function main() {
  const user: typeof users.$inferInsert = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  await db.insert(users).values(user);

  // const usersList = await db.select().from(users);
  // console.log('Getting all users from the database: ', usersList)
  // await db.update(users).set({ age: 31 }).where(eq(users.email, user.email));
  // await db.delete(users).where(eq(users.email, user.email));
}

main();
