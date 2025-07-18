import { users } from "@/db/schema";

export type User = Omit<typeof users.$inferSelect, 'salt' | 'password' | 'image' | 'createdAt' | 'updatedAt'> & {
  image?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
} | null;