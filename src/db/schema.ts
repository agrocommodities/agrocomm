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

// export const subscriptions = sqliteTable("subscriptions", {
//   id: int().primaryKey({ autoIncrement: true }),
//   userId: int().notNull().references(() => users.id, { onDelete: 'cascade' }),
//   stripeSubscriptionId: text().notNull().unique(),
//   stripePriceId: text().notNull(),
//   stripeCustomerId: text().notNull(),
//   status: text().notNull(), // active, canceled, etc.
//   planName: text().notNull(),
//   planPrice: int().notNull(), // preço em centavos
//   planInterval: text().notNull(), // month, year
//   firstSubscriptionDate: text().notNull(), // ISO string
//   currentPeriodStart: text().notNull(), // ISO string
//   currentPeriodEnd: text().notNull(), // ISO string
//   lastPaymentDate: text().notNull(), // ISO string
//   createdAt: text().notNull().default(sql`(current_timestamp)`),
//   updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
// });

// src/db/schema.ts (adicionar na tabela subscriptions)
// export const subscriptions = sqliteTable("subscriptions", {
//   id: int().primaryKey({ autoIncrement: true }),
//   userId: int().notNull().references(() => users.id, { onDelete: 'cascade' }),
//   stripeSubscriptionId: text().notNull().unique(),
//   stripePriceId: text().notNull(),
//   stripeCustomerId: text().notNull(),
//   status: text().notNull(), // active, canceled, etc.
//   planName: text().notNull(),
//   planPrice: int().notNull(), // preço em centavos
//   planInterval: text().notNull(), // month, year
//   firstSubscriptionDate: text().notNull(), // ISO string
//   currentPeriodStart: text().notNull(), // ISO string
//   currentPeriodEnd: text().notNull(), // ISO string
//   lastPaymentDate: text().notNull(), // ISO string
  
//   // Novos campos úteis
//   cancelAtPeriodEnd: int().default(0), // boolean (0/1)
//   canceledAt: text(), // ISO string quando cancelado
//   trialStart: text(), // ISO string se teve trial
//   trialEnd: text(), // ISO string se teve trial
  
//   createdAt: text().notNull().default(sql`(current_timestamp)`),
//   updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
// });

// src/db/schema.ts (atualizar a tabela subscriptions)
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
  
  // Novos campos
  cancelAtPeriodEnd: int().default(0),
  canceledAt: text(),
  trialStart: text(),
  trialEnd: text(),
  
  createdAt: text().notNull().default(sql`(current_timestamp)`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
});

export const news = sqliteTable("news", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull(),
  source: text().notNull(),
  summary: text(),
  imageUrl: text(),
  publishedAt: int({ mode: "timestamp" }),
});

// Tabela simplificada de estados - apenas para referência
export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(), // SP, MG, etc.
  name: text().notNull().unique(), // São Paulo, Minas Gerais, etc.
});

// Tabela simplificada de cidades - apenas para referência
export const cities = sqliteTable("cities", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  state: text().notNull(), // Código do estado (SP, MG, etc.)
}, (table) => [
  uniqueIndex("unique_city").on(table.name, table.state),
]);

// Tabela de preços simplificada - estado e cidade como strings
export const prices = sqliteTable("prices", {
  id: int().primaryKey({ autoIncrement: true }),
  commodity: text().notNull(), // soja, milho, boi, vaca
  state: text().notNull(), // Código do estado (SP, MG, etc.)
  city: text().notNull(), // Nome da cidade
  price: int().notNull(), // Preço em centavos
  date: text().notNull(), // Data no formato YYYY-MM-DD
  source: text(),
  createdAt: text().notNull().default(sql`(date('now'))`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString().split('T')[0]),
  variation: int().default(0), // Variação em pontos base
}, (table) => [
  uniqueIndex("unique_price").on(
    table.commodity,
    table.state,
    table.city,
    table.date,
    table.price
  ),
]);

// Índices para melhor performance
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
  stateId: int().references(() => states.id), // null = todos os estados
  alertType: text().notNull(), // 'daily', 'weekly', 'monthly', 'price_change'
  minPrice: int(), // preço mínimo em centavos
  maxPrice: int(), // preço máximo em centavos
  isActive: int().notNull().default(1),
  createdAt: text().notNull().default(sql`(date('now'))`),
});