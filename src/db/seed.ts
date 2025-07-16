import { db } from '@/db'
import { users } from '@/db/schema'

// import { hashPassword, generateSalt } from '@/lib/auth'

// const password = await hashPassword('agrocomm', generateSalt())

async function main() {
  const user: typeof users.$inferInsert = {
    name: 'AgroComm',
    username: 'agrocomm',
    email: 'agrocomm@agrocomm.com.br',
    password: 'agrocomm',
    role: 'admin'
  }

  await db.insert(users).values(user).onConflictDoNothing()
}

main()

// const db = drizzle(process.env.DB_FILE_NAME!);

// async function main() {
//   const user: typeof users.$inferInsert = {
//     name: "John",
//     age: 30,
//     email: "john@example.com",
//   };

//   await db.insert(users).values(user).onConflictDoNothing();

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
// }

// main();
