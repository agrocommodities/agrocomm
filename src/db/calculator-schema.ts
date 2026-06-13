import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sharedCattleCalculations = sqliteTable(
  "shared_cattle_calculations",
  {
    uuid: text().primaryKey(),
    data: text().notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
);
