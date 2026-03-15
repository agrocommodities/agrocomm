import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
 * Regiões de referência das cotações (Estado + Cidade de referência)
 */
export const regions = sqliteTable("regions", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(), // ex: "ms-campo-grande"
  name: text().notNull(), // ex: "Campo Grande"
  state: text().notNull(), // ex: "MS"
  city: text().notNull(), // ex: "Campo Grande"
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
  regionId: int("region_id")
    .notNull()
    .references(() => regions.id),
  sourceId: int("source_id")
    .notNull()
    .references(() => sources.id),
  price: real().notNull(),
  variation: real(), // variação % em relação ao dia anterior
  quoteDate: text("quote_date").notNull(), // "YYYY-MM-DD"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

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

// ── Analytics ─────────────────────────────────────────────────────────────────

export const pageViews = sqliteTable("page_views", {
  id: int().primaryKey({ autoIncrement: true }),
  path: text().notNull(),
  referrer: text(),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
