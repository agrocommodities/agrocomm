import "server-only";

import { db } from "@/db";
import { prices } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import { signInSchema, signUpSchema } from "@/schemas/auth";

export async function getPrices() {
  return await db.select().from(prices);
}


