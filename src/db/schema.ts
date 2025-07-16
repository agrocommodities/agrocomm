import { int, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text(),
  username: text().unique(),
  email: text().notNull().unique(),
  password: text().notNull(),
  image: text().default("/images/avatar.svg"),
  role: text({ enum: ["admin", "user"] }).default("user").notNull(),
  salt: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessions = sqliteTable("sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().references(() => users.id), // Changed from integer() to uuid()
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const prices = sqliteTable("prices", {
  id: int().primaryKey({ autoIncrement: true }),
  commodity: text().default("soja").notNull(),
  state: text().notNull(),
  city: text().default("N/A").notNull(),
  price: int().notNull(),
  variation: int(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  source: text().default("scot").notNull(),
});
