import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

type FullUser = InferSelectModel<typeof users>;
// export type NewUser = InferInsertModel<typeof users>;

// Tipo para sessão
export type SessionUser = {
  id: number;
  email: string;
  role: string | null;
};


export type User = Omit<FullUser, "password" | "salt"> | null;

export interface State {
  code: string;
  name: string;
  flag?: string;
}

export interface News {
  title: string;
  url: string;
  source: string;
  summary?: string;
  imageUrl?: string;
}