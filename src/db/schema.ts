import { sql, relations } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  username: text().unique(),
  email: text().notNull().unique(),
  avatar: text().default("/images/avatar.svg"),
  password: text().notNull(),
  salt: text().notNull(),
  role: text().notNull().default("guest"),
  createdAt: text().notNull().default(sql`(current_timestamp)`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
});

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptions = sqliteTable("subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text().notNull().unique(),
  stripePriceId: text().notNull(),
  stripeCustomerId: text().notNull(),
  status: text().notNull(),
  planName: text().notNull(),
  planPrice: int().notNull(),
  planInterval: text().notNull(),
  firstSubscriptionDate: text().notNull(),
  currentPeriodStart: text().notNull(),
  currentPeriodEnd: text().notNull(),
  lastPaymentDate: text().notNull(),
  cancelAtPeriodEnd: int().default(0),
  canceledAt: text(),
  trialStart: text(),
  trialEnd: text(),
  createdAt: text().notNull().default(sql`(current_timestamp)`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const news = sqliteTable("news", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull(),
  source: text().notNull(),
  summary: text(),
  imageUrl: text(),
  publishedAt: int({ mode: "timestamp" }),
});

export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  name: text().notNull().unique(),
});

export const cities = sqliteTable("cities", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  state: text().notNull(),
}, (table) => [
  uniqueIndex("unique_city").on(table.name, table.state),
]);

export const prices = sqliteTable("prices", {
  id: int().primaryKey({ autoIncrement: true }),
  commodity: text().notNull(),
  state: text().notNull(),
  city: text().notNull(),
  price: int().notNull(),
  date: text().notNull(),
  source: text(),
  createdAt: text().notNull().default(sql`(date('now'))`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString().split('T')[0]),
  variation: int().default(0),
}, (table) => [
  uniqueIndex("unique_price").on(
    table.commodity,
    table.state,
    table.city,
    table.date,
    table.price
  ),
]);

export const pricesDateIndex = index("prices_date_idx").on(prices.date);
export const pricesCommodityStateIndex = index("prices_commodity_state_idx").on(
  prices.commodity,
  prices.state,
  prices.city,
  prices.date
);

export const alertSubscriptions = sqliteTable("alert_subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  commodity: text().notNull(),
  stateId: int().references(() => states.id),
  alertType: text().notNull(),
  minPrice: int(),
  maxPrice: int(),
  isActive: int().notNull().default(1),
  createdAt: text().notNull().default(sql`(date('now'))`),
});