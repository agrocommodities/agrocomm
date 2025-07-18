import { users } from "@/db/schema";

// export type DBUser = ;

export type User = Omit<typeof users.$inferSelect, 'salt' | 'password'> & {
  name?: string | null;
  image?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

// export interface User {
//   id: string | number
//   name?: string
//   email: string
//   role: 'admin' | 'user'
//   avatar?: string
//   createdAt?: Date
//   updatedAt?: Date
// }

// export interface User {
//   user: {
//     id: number;
//     email: string;
//     role: string;
//     name?: string | null;
//     username?: string | null;
//   } | null;
// }