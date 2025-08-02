import { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";

type FullUser = InferSelectModel<typeof users>;
// export type NewUser = InferInsertModel<typeof users>;

export type User = Omit<FullUser, "password" | "salt"> | null;

export interface State {
  abbr: string;
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