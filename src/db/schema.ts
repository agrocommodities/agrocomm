import { sql } from "drizzle-orm";
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

export const news = sqliteTable("news", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  url: text().notNull(),
  source: text().notNull(),
  summary: text(),
  imageUrl: text(),
  publishedAt: int({ mode: "timestamp" }),
});

// src/db/schema.ts (atualizar a parte das cotações)
export const commodities = sqliteTable("commodities", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  slug: text().notNull().unique(),
  unit: text().notNull(),
  createdAt: text().notNull().default(sql`(current_timestamp)`),
});

export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  name: text().notNull(),
});

export const cities = sqliteTable("cities", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  stateId: int().notNull().references(() => states.id),
}, (table) => [
  uniqueIndex("unique_city").on(table.name, table.stateId),
]);

// export const prices = sqliteTable("prices", {
//   id: int().primaryKey({ autoIncrement: true }),
//   commodityId: int().notNull().references(() => commodities.id),
//   stateId: int().notNull().references(() => states.id),
//   cityId: int().references(() => cities.id), // opcional, algumas cotações podem ser só por estado
//   price: int().notNull(),
//   date: text().notNull().default(sql`(current_timestamp)`),
//   // date: text().notNull(), // formato YYYY-MM-DD
//   source: text(), // opcional: URL ou nome da fonte
//   createdAt: text().notNull().default(sql`(current_timestamp)`),
//   updatedAt: text().notNull().$onUpdate(() => new Date().toISOString()),
//   variation: int().default(0), // variação percentual em relação ao último preço
// }, (table) => [
//   // Índice único para evitar duplicatas
//   uniqueIndex("unique_price").on(
//     table.commodityId,
//     table.stateId,
//     table.cityId, // incluindo cidade na proteção
//     table.date,
//     table.price
//   ),
// ]);

export const prices = sqliteTable("prices", {
  id: int().primaryKey({ autoIncrement: true }),
  commodityId: int().notNull().references(() => commodities.id),
  stateId: int().notNull().references(() => states.id),
  cityId: int().references(() => cities.id),
  price: int().notNull(), // Preço em centavos (ex: 15250 = R$ 152,50)
  date: text().notNull(), // formato YYYY-MM-DD
  source: text(),
  createdAt: text().notNull().default(sql`(date('now'))`),
  updatedAt: text().notNull().$onUpdate(() => new Date().toISOString().split('T')[0]),
  variation: int().default(0), // variação em pontos base (ex: 150 = 1.5%)
}, (table) => [
  uniqueIndex("unique_price").on(
    table.commodityId,
    table.stateId,
    table.cityId,
    table.date
  ),
]);

// Índices para melhor performance
export const pricesDateIndex = index("prices_date_idx").on(prices.date);
export const pricesCommodityStateIndex = index("prices_commodity_state_idx").on(
  prices.commodityId,
  prices.stateId
);

export const alertSubscriptions = sqliteTable("alert_subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  commodityId: int().notNull().references(() => commodities.id),
  stateId: int().references(() => states.id), // null = todos os estados
  alertType: text().notNull(), // 'daily', 'weekly', 'monthly', 'price_change'
  minPrice: int(), // preço mínimo em centavos
  maxPrice: int(), // preço máximo em centavos
  isActive: int().notNull().default(1),
  createdAt: text().notNull().default(sql`(date('now'))`),
});
