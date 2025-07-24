import { int, text, unique, sqliteTable } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import type { Roles, SubscriptionPlans, SubscriptionStatus } from "@/types";

// export const subscriptionPlans = ["free", "basic", "pro", "enterprise"] as const;
// export const subscriptionStatus = ["active", "cancelled", "past_due", "trialing"] as const;

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  email: text().notNull().unique(),
  password: text().notNull(),
  // role: text({ enum: roles }).default("user").notNull(),
  role: text().$type<Roles>().default("guest"),
  salt: text(),
  emailVerified: int({ mode: "boolean" }).default(false),
  emailVerificationToken: text(),
  emailVerificationExpires: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
  // ✅ Novos campos para controle de reenvio
  emailResendCount: int().default(0), 
  emailLastResent: text(),
  emailResendBlocked: int({ mode: "boolean" }).default(false),
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
  // plan: text({ enum: subscriptionPlans }).default("free").notNull(),
  plan: text().$type<SubscriptionPlans>().default("free"),
  // status: text({ enum: subscriptionStatus }).default("active").notNull(),
  status: text().$type<SubscriptionStatus>().default("active"),
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
  date: text(),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text(),
  source: text().default("scot").notNull(),
}, (t) => [
  unique().on(t.commodity, t.createdAt, t.state, t.city),
]);

export const news = sqliteTable("news", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull(),
  source: text().notNull(),
  summary: text(),
  imageUrl: text(),
  publishedAt: int({ mode: "timestamp" }),
});
