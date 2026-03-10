import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
// import { eq } from "drizzle-orm";
import { users } from "./schema";

const db = drizzle(process.env.DB_FILE_NAME!);

async function main() {
  const user: typeof users.$inferInsert = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  await db.insert(users).values(user);
  console.log("New user created!");

  const allUsers = await db.select().from(users);
  console.log("Getting all users from the database: ", allUsers);

  // await db
  //   .update(users)
  //   .set({
  //     age: 31,
  //   })
  //   .where(eq(users.email, user.email));
  // console.log('User info updated!')

  // await db.delete(usersTable).where(eq(usersTable.email, user.email));
  // console.log('User deleted!')
}

main();
