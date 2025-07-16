import { drizzle } from "drizzle-orm/libsql";
import { users } from "@/db/schema";

const db = drizzle(process.env.DB_FILE_NAME!);

async function main() {
  const user: typeof users.$inferInsert = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  await db.insert(users).values(user).onConflictDoNothing();

  // const users = await db.select().from(usersTable);
  // console.log("Getting all users from the database: ", users);
  // /*
  // const users: {
  //   id: number;
  //   name: string;
  //   age: number;
  //   email: string;
  // }[]
  // */

  // await db
  //   .update(usersTable)
  //   .set({
  //     age: 31,
  //   })
  //   .where(eq(usersTable.email, user.email));
  // console.log("User info updated!");

  // await db.delete(usersTable).where(eq(usersTable.email, user.email));
  // console.log("User deleted!");
}

main();
