import { int, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const roles = ["admin", "user"] as const;
export const subscriptionPlans = ["free", "basic", "pro", "enterprise"] as const;
export const subscriptionStatus = ["active", "cancelled", "past_due", "trialing"] as const;

// export const users = sqliteTable("users", {
//   id: int().primaryKey({ autoIncrement: true }),
//   email: text().notNull().unique(),
//   password: text().notNull(),
//   role: text({ enum: ["admin", "user"] })
//     .default("user")
//     .notNull(),
//   salt: text(),
//   createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
//   updatedAt: text(),
// });

// src/db/schema.ts (adicionar campos de verificação)
export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  email: text().notNull().unique(),
  password: text().notNull(),
  role: text({ enum: ["admin", "user"] })
    .default("user")
    .notNull(),
  salt: text(),
  emailVerified: int({ mode: "boolean" }).default(false),
  emailVerificationToken: text(),
  emailVerificationExpires: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
});

export const profiles = sqliteTable("profiles", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text(),
  username: text().unique(),
  bio: text(),
  avatar: text().default("/images/avatar.svg"),
  phone: text(),
  location: text(),
  website: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
});

// Adicione a tabela de subscrições
export const subscriptions = sqliteTable("subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  plan: text({ enum: subscriptionPlans }).default("free").notNull(),
  status: text({ enum: subscriptionStatus }).default("active").notNull(),
  currentPeriodStart: text(),
  currentPeriodEnd: text(),
  cancelAtPeriodEnd: int({ mode: "boolean" }).default(false),
  stripeCustomerId: text(),
  stripeSubscriptionId: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
});

// Adicione as relações
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// Atualize usersRelations para incluir subscription
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  sessions: many(sessions),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable("sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().references(() => users.id, { onDelete: "cascade" }),
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
