import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ── Autenticação ──────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text().notNull().default("user"), // "user" | "admin"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text().notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Localização ───────────────────────────────────────────────────────────────

export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(), // ex: "MS", "MT"
  name: text().notNull(),          // ex: "Mato Grosso do Sul"
});

export const cities = sqliteTable("cities", {
  id: int().primaryKey({ autoIncrement: true }),
  stateId: int("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "cascade" }),
  name: text().notNull(), // ex: "Campo Grande"
  slug: text().notNull().unique(), // ex: "ms-campo-grande"
});

export const statesRelations = relations(states, ({ many }) => ({
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, { fields: [cities.stateId], references: [states.id] }),
  quotes: many(quotes),
}));

// ── Cotações ──────────────────────────────────────────────────────────────────

/**
 * Categorias de produtos: "graos" | "pecuaria" | "cafe" | "acucar" | "algodao"
 */
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(), // ex: "soja", "boi-gordo"
  name: text().notNull(), // ex: "Soja", "Boi Gordo"
  category: text().notNull(), // ex: "graos", "pecuaria"
  unit: text().notNull(), // ex: "R$/saca 60kg", "R$/arroba"
});

/**
 * Fontes de scraping (permite fallback entre fontes)
 */
export const sources = sqliteTable("sources", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(), // ex: "scotconsultoria", "noticiasagricolas"
  name: text().notNull(),
  url: text().notNull(),
  priority: int().notNull().default(1), // menor = maior prioridade
  active: int().notNull().default(1), // 0 = desabilitado
});

/**
 * Cotações coletadas pelo scraper
 */
export const quotes = sqliteTable("quotes", {
  id: int().primaryKey({ autoIncrement: true }),
  productId: int("product_id")
    .notNull()
    .references(() => products.id),
  cityId: int("city_id")
    .notNull()
    .references(() => cities.id),
  sourceId: int("source_id")
    .notNull()
    .references(() => sources.id),
  price: real().notNull(),
  variation: real(), // variação % em relação ao dia anterior
  quoteDate: text("quote_date").notNull(), // "YYYY-MM-DD"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const quotesRelations = relations(quotes, ({ one }) => ({
  product: one(products, { fields: [quotes.productId], references: [products.id] }),
  city: one(cities, { fields: [quotes.cityId], references: [cities.id] }),
  source: one(sources, { fields: [quotes.sourceId], references: [sources.id] }),
}));

/**
 * Log de execuções do scraper (para monitoramento)
 */
export const scraperLogs = sqliteTable("scraper_logs", {
  id: int().primaryKey({ autoIncrement: true }),
  sourceId: int("source_id").references(() => sources.id),
  status: text().notNull(), // "success" | "error" | "skipped"
  quotesInserted: int("quotes_inserted").default(0),
  errorMessage: text("error_message"),
  executedAt: text("executed_at").notNull().default(sql`(datetime('now'))`),
});

// ── Notícias ──────────────────────────────────────────────────────────────────

/**
 * Artigos de notícias agropecuárias coletados via scraping
 */
export const newsArticles = sqliteTable("news_articles", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  slug: text().notNull().unique(),
  excerpt: text().notNull(),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  category: text().notNull().default("geral"), // "geral" | "pecuaria" | "graos" | "clima"
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Analytics ─────────────────────────────────────────────────────────────────

export const pageViews = sqliteTable("page_views", {
  id: int().primaryKey({ autoIncrement: true }),
  path: text().notNull(),
  referrer: text(),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
