import { sql, relations } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex, index, foreignKey } from "drizzle-orm/sqlite-core";

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

export const cities = sqliteTable("cities", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  state: text().notNull().references(() => states.code),
}, (table) => [
  uniqueIndex("unique_city").on(table.name, table.state),
]);

export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  name: text().notNull(),
});

export const prices = sqliteTable("prices", {
  id: int().primaryKey({ autoIncrement: true }),
  commodity: text().notNull(),
  state: text().notNull().references(() => states.code),
  city: text().notNull(), // Nome da cidade
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
    table.date
  ),
  
  // Chave estrangeira composta
  foreignKey({
    columns: [table.state, table.city],
    foreignColumns: [cities.state, cities.name],
  })
]);

export const pricesRelations = relations(prices, ({ one }) => ({
  city: one(cities, {
    fields: [prices.state, prices.city], // Campos LOCAIS
    references: [cities.state, cities.name] // Campos REFERENCIADOS
  }),
  state: one(states, {
    fields: [prices.state],
    references: [states.code]
  }) 
}));

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
