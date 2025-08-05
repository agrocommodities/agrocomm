import "server-only";

import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPrices() {
  return await db.select().from(prices);
}

export async function getPricesByState(state: string) {
  return await db
    .select()
    .from(prices)
    .where(eq(prices.state, state.toUpperCase().trim()));
}


