import {
  int,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ── Cargos e Permissões ──────────────────────────────────────────────────────

export const roles = sqliteTable("roles", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  description: text(),
  icon: text().notNull().default("Shield"),
  isSystem: int("is_system").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const permissions = sqliteTable("permissions", {
  id: int().primaryKey({ autoIncrement: true }),
  key: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  category: text().notNull().default("geral"),
});

export const rolePermissions = sqliteTable("role_permissions", {
  id: int().primaryKey({ autoIncrement: true }),
  roleId: int("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: int("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
});

export const userPermissions = sqliteTable("user_permissions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: int("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  granted: int().notNull().default(1), // 1 = conceder, 0 = revogar
});

// ── Autenticação ──────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: int("email_verified").notNull().default(0),
  role: text().notNull().default("user"),
  roleId: int("role_id").references(() => roles.id, { onDelete: "set null" }),
  avatarUrl: text("avatar_url"),
  countryId: int("country_id"),
  geoStateId: int("geo_state_id"),
  geoCityId: int("geo_city_id"),
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

export const emailVerificationTokens = sqliteTable(
  "email_verification_tokens",
  {
    id: int().primaryKey({ autoIncrement: true }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text().notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Localização ───────────────────────────────────────────────────────────────

export const states = sqliteTable("states", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(), // ex: "MS", "MT"
  name: text().notNull(), // ex: "Mato Grosso do Sul"
});

export const cities = sqliteTable(
  "cities",
  {
    id: int().primaryKey({ autoIncrement: true }),
    stateId: int("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull(), // ex: "campo-grande"
  },
  (table) => [
    uniqueIndex("cities_state_slug_idx").on(table.stateId, table.slug),
  ],
);

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
  product: one(products, {
    fields: [quotes.productId],
    references: [products.id],
  }),
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

/**
 * Conflitos de cotações (quando duas fontes reportam preços diferentes
 * para o mesmo produto, cidade e data)
 */
export const quoteConflicts = sqliteTable("quote_conflicts", {
  id: int().primaryKey({ autoIncrement: true }),
  quoteId: int("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  productId: int("product_id")
    .notNull()
    .references(() => products.id),
  cityId: int("city_id")
    .notNull()
    .references(() => cities.id),
  quoteDate: text("quote_date").notNull(),
  keptSourceId: int("kept_source_id")
    .notNull()
    .references(() => sources.id),
  keptPrice: real("kept_price").notNull(),
  rejectedSourceId: int("rejected_source_id")
    .notNull()
    .references(() => sources.id),
  rejectedPrice: real("rejected_price").notNull(),
  status: text().notNull().default("pending"), // "pending" | "accepted" | "dismissed"
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const quoteConflictsRelations = relations(quoteConflicts, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteConflicts.quoteId],
    references: [quotes.id],
  }),
  product: one(products, {
    fields: [quoteConflicts.productId],
    references: [products.id],
  }),
  city: one(cities, {
    fields: [quoteConflicts.cityId],
    references: [cities.id],
  }),
  keptSource: one(sources, {
    fields: [quoteConflicts.keptSourceId],
    references: [sources.id],
  }),
  rejectedSource: one(sources, {
    fields: [quoteConflicts.rejectedSourceId],
    references: [sources.id],
  }),
}));

// ── Fontes de Notícias ────────────────────────────────────────────────────────

export const newsSources = sqliteTable("news_sources", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  url: text().notNull(),
  category: text().notNull().default("geral"),
  active: int().notNull().default(1),
});

// ── Notícias ──────────────────────────────────────────────────────────────────

export const newsArticles = sqliteTable("news_articles", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  slug: text().notNull().unique(),
  excerpt: text().notNull(),
  content: text(), // full article content (HTML)
  imageUrl: text("image_url"),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name").notNull(),
  category: text().notNull().default("geral"),
  publishedAt: text("published_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Tags de Notícias ──────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
});

export const newsArticleTags = sqliteTable("news_article_tags", {
  id: int().primaryKey({ autoIncrement: true }),
  articleId: int("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  tagId: int("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const newsArticleTagsRelations = relations(
  newsArticleTags,
  ({ one }) => ({
    article: one(newsArticles, {
      fields: [newsArticleTags.articleId],
      references: [newsArticles.id],
    }),
    tag: one(tags, {
      fields: [newsArticleTags.tagId],
      references: [tags.id],
    }),
  }),
);

export const newsArticlesRelations = relations(newsArticles, ({ many }) => ({
  articleTags: many(newsArticleTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(newsArticleTags),
}));

// ── Analytics ─────────────────────────────────────────────────────────────────

export const pageViews = sqliteTable("page_views", {
  id: int().primaryKey({ autoIncrement: true }),
  path: text().notNull(),
  referrer: text(),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Mensagens de Contato ──────────────────────────────────────────────────────

export const contactMessages = sqliteTable("contact_messages", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull(),
  subject: text().notNull(),
  message: text().notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Cotação do Dólar ──────────────────────────────────────────────────────────

export const exchangeRates = sqliteTable("exchange_rates", {
  id: int().primaryKey({ autoIncrement: true }),
  pair: text().notNull(), // ex: "USD/BRL"
  rate: real().notNull(),
  rateDate: text("rate_date").notNull(), // "YYYY-MM-DD"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Classificados ─────────────────────────────────────────────────────────────

export const classifiedCategories = sqliteTable("classified_categories", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  icon: text(), // lucide icon name
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const classifieds = sqliteTable("classifieds", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: int("category_id")
    .notNull()
    .references(() => classifiedCategories.id),
  title: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  price: real().notNull(),
  previousPrice: real("previous_price"), // preço anterior (para mostrar variação)
  stateId: int("state_id")
    .notNull()
    .references(() => states.id),
  cityId: int("city_id")
    .notNull()
    .references(() => cities.id),
  year: int(),
  mileage: int(),
  status: text().notNull().default("pending"), // "pending" | "approved" | "rejected" | "blocked"
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const classifiedImages = sqliteTable("classified_images", {
  id: int().primaryKey({ autoIncrement: true }),
  classifiedId: int("classified_id")
    .notNull()
    .references(() => classifieds.id, { onDelete: "cascade" }),
  url: text().notNull(),
  position: int().notNull().default(0),
});

export const classifiedComments = sqliteTable("classified_comments", {
  id: int().primaryKey({ autoIncrement: true }),
  classifiedId: int("classified_id")
    .notNull()
    .references(() => classifieds.id, { onDelete: "cascade" }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text().notNull(),
  originalContent: text("original_content"), // before moderation
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at"),
});

// Relations
export const classifiedsRelations = relations(classifieds, ({ one, many }) => ({
  user: one(users, { fields: [classifieds.userId], references: [users.id] }),
  category: one(classifiedCategories, {
    fields: [classifieds.categoryId],
    references: [classifiedCategories.id],
  }),
  state: one(states, {
    fields: [classifieds.stateId],
    references: [states.id],
  }),
  city: one(cities, { fields: [classifieds.cityId], references: [cities.id] }),
  images: many(classifiedImages),
  comments: many(classifiedComments),
}));

export const classifiedImagesRelations = relations(
  classifiedImages,
  ({ one }) => ({
    classified: one(classifieds, {
      fields: [classifiedImages.classifiedId],
      references: [classifieds.id],
    }),
  }),
);

export const classifiedCommentsRelations = relations(
  classifiedComments,
  ({ one }) => ({
    classified: one(classifieds, {
      fields: [classifiedComments.classifiedId],
      references: [classifieds.id],
    }),
    user: one(users, {
      fields: [classifiedComments.userId],
      references: [users.id],
    }),
  }),
);

// ── Moderação ─────────────────────────────────────────────────────────────────

export const moderationSettings = sqliteTable("moderation_settings", {
  id: int().primaryKey({ autoIncrement: true }),
  key: text().notNull().unique(), // "block_phones" | "block_emails" | "block_addresses" | "block_social" | "block_links"
  enabled: int().notNull().default(1), // 1 = enabled
  action: text().notNull().default("censor"), // "censor" | "censor_notify" | "delete" | "delete_notify" | "none"
  censorText: text("censor_text").notNull().default("[contato removido]"),
});

// ── Notificações ──────────────────────────────────────────────────────────────

export const notifications = sqliteTable("notifications", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text().notNull(),
  message: text().notNull(),
  read: int().notNull().default(0), // 0 = unread, 1 = read
  link: text(), // optional link to navigate to
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Assinantes de cotações via WhatsApp
 */
export const whatsappSubscribers = sqliteTable("whatsapp_subscribers", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  phone: text().notNull().unique(), // formato internacional: 5567998552020
  active: int().notNull().default(1), // 0 = pausado, 1 = ativo
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * Produtos selecionados por cada assinante
 */
export const whatsappSubscriberProducts = sqliteTable(
  "whatsapp_subscriber_products",
  {
    id: int().primaryKey({ autoIncrement: true }),
    subscriberId: int("subscriber_id")
      .notNull()
      .references(() => whatsappSubscribers.id, { onDelete: "cascade" }),
    productId: int("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
);

/**
 * Log de envios WhatsApp
 */
export const whatsappLogs = sqliteTable("whatsapp_logs", {
  id: int().primaryKey({ autoIncrement: true }),
  subscriberId: int("subscriber_id").references(() => whatsappSubscribers.id, {
    onDelete: "set null",
  }),
  phone: text().notNull(),
  status: text().notNull(), // "success" | "error"
  messageId: text("message_id"), // ID retornado pela API do WhatsApp
  errorMessage: text("error_message"),
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
});

export const whatsappSubscribersRelations = relations(
  whatsappSubscribers,
  ({ many }) => ({
    products: many(whatsappSubscriberProducts),
    logs: many(whatsappLogs),
  }),
);

export const whatsappSubscriberProductsRelations = relations(
  whatsappSubscriberProducts,
  ({ one }) => ({
    subscriber: one(whatsappSubscribers, {
      fields: [whatsappSubscriberProducts.subscriberId],
      references: [whatsappSubscribers.id],
    }),
    product: one(products, {
      fields: [whatsappSubscriberProducts.productId],
      references: [products.id],
    }),
  }),
);

export const whatsappLogsRelations = relations(whatsappLogs, ({ one }) => ({
  subscriber: one(whatsappSubscribers, {
    fields: [whatsappLogs.subscriberId],
    references: [whatsappSubscribers.id],
  }),
}));

// ── Assinaturas ──────────────────────────────────────────────────────────────

/**
 * Planos de assinatura configuráveis pelo admin
 */
export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(), // "bronze" | "prata" | "ouro"
  name: text().notNull(),
  description: text(),
  priceMonthly: real("price_monthly").notNull(), // R$ mensal
  priceWeekly: real("price_weekly").notNull(), // R$ semanal
  maxClassifieds: int("max_classifieds").notNull().default(0),
  emailBulletins: int("email_bulletins").notNull().default(0), // 0/1
  priceHistory: int("price_history").notNull().default(0), // 0/1
  historyDays: int("history_days").notNull().default(0), // dias de histórico
  active: int().notNull().default(1),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * Assinaturas dos usuários
 */
export const subscriptions = sqliteTable("subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: int("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  status: text().notNull().default("pending"), // "active" | "cancelled" | "expired" | "past_due" | "pending"
  period: text().notNull().default("monthly"), // "monthly" | "weekly"
  mpSubscriptionId: text("mp_subscription_id"), // ID no Mercado Pago (null se admin-granted)
  mpPayerId: text("mp_payer_id"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  grantedByAdmin: int("granted_by_admin").notNull().default(0), // 0/1
  grantedBy: int("granted_by").references(() => users.id, {
    onDelete: "set null",
  }),
  grantedUntil: text("granted_until"), // null = vitalício
  cancelledAt: text("cancelled_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * Histórico de pagamentos
 */
export const payments = sqliteTable("payments", {
  id: int().primaryKey({ autoIncrement: true }),
  subscriptionId: int("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mpPaymentId: text("mp_payment_id"),
  mpStatus: text("mp_status"), // "approved" | "pending" | "rejected" | "cancelled"
  amount: real().notNull(),
  paymentMethod: text("payment_method"), // "pix" | "credit_card" | "debit_card" | "boleto"
  pixQrCode: text("pix_qr_code"),
  pixQrCodeBase64: text("pix_qr_code_base64"),
  boletoUrl: text("boleto_url"),
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/**
 * Configuração de alertas de assinatura (admin)
 */
export const subscriptionAlertSettings = sqliteTable(
  "subscription_alert_settings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    alertType: text("alert_type").notNull().unique(), // "card_declined" | "expiring" | "expired" | "pix_pending" | "boleto_pending"
    enabled: int().notNull().default(1),
    emailTemplate: text("email_template"),
    daysBefore: int("days_before").default(3), // dias antes do vencimento
    daysAfter: int("days_after").default(7), // dias após vencimento
    maxAttempts: int("max_attempts").default(3),
    intervalHours: int("interval_hours").default(24),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
);

/**
 * Log de alertas enviados
 */
export const subscriptionAlerts = sqliteTable("subscription_alerts", {
  id: int().primaryKey({ autoIncrement: true }),
  subscriptionId: int("subscription_id").references(() => subscriptions.id, {
    onDelete: "cascade",
  }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(),
  sentAt: text("sent_at").notNull().default(sql`(datetime('now'))`),
  status: text().notNull().default("sent"), // "sent" | "failed"
});

/**
 * Cotações acompanhadas pelo usuário (para boletins)
 */
export const userQuoteSubscriptions = sqliteTable("user_quote_subscriptions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: int("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  cityId: int("city_id").references(() => cities.id, { onDelete: "cascade" }), // null = todas as cidades
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Relations de Assinaturas ─────────────────────────────────────────────────

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    subscriptions: many(subscriptions),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  granter: one(users, {
    fields: [subscriptions.grantedBy],
    references: [users.id],
    relationName: "grantedSubscriptions",
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const userQuoteSubscriptionsRelations = relations(
  userQuoteSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userQuoteSubscriptions.userId],
      references: [users.id],
    }),
    product: one(products, {
      fields: [userQuoteSubscriptions.productId],
      references: [products.id],
    }),
    city: one(cities, {
      fields: [userQuoteSubscriptions.cityId],
      references: [cities.id],
    }),
  }),
);

// ── Logs de Auditoria ─────────────────────────────────────────────────────────

export const auditLogs = sqliteTable("audit_logs", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text().notNull(), // "login_success" | "login_failed" | "classified_created" | "comment_moderated" | etc.
  target: text(), // e.g. "classified:42", "comment:15"
  details: text(), // JSON string with extra info
  originalText: text("original_text"), // for moderation: the original content
  replacedText: text("replaced_text"), // for moderation: what it was replaced with
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ── Cotações Chicago (CBOT) ──────────────────────────────────────────────────

export const chicagoQuotes = sqliteTable(
  "chicago_quotes",
  {
    id: int().primaryKey({ autoIncrement: true }),
    symbol: text().notNull(), // e.g. "ZS=F"
    key: text().notNull(), // e.g. "soja"
    name: text().notNull(), // e.g. "Soja"
    category: text().notNull(), // "graos" | "pecuaria" | "outros"
    price: real().notNull(),
    change: real().notNull().default(0),
    changePercent: real("change_percent").notNull().default(0),
    currency: text().notNull().default("USD"),
    unit: text().notNull(),
    exchangeRate: real("exchange_rate"),
    quoteDate: text("quote_date").notNull(), // "YYYY-MM-DD"
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("chicago_quotes_symbol_date_idx").on(
      table.symbol,
      table.quoteDate,
    ),
  ],
);

// ── Geografia Mundial (para endereço de usuários) ────────────────────────────

export const geoCountries = sqliteTable("geo_countries", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  iso2: text().notNull().unique(),
  iso3: text().notNull(),
  phonecode: text(),
  currency: text(),
  emoji: text(),
});

export const geoStates = sqliteTable("geo_states", {
  id: int().primaryKey({ autoIncrement: true }),
  countryId: int("country_id")
    .notNull()
    .references(() => geoCountries.id, { onDelete: "cascade" }),
  name: text().notNull(),
  iso2: text(),
});

export const geoCities = sqliteTable("geo_cities", {
  id: int().primaryKey({ autoIncrement: true }),
  stateId: int("state_id")
    .notNull()
    .references(() => geoStates.id, { onDelete: "cascade" }),
  name: text().notNull(),
});

export const geoCountriesRelations = relations(geoCountries, ({ many }) => ({
  states: many(geoStates),
}));

export const geoStatesRelations = relations(geoStates, ({ one, many }) => ({
  country: one(geoCountries, {
    fields: [geoStates.countryId],
    references: [geoCountries.id],
  }),
  cities: many(geoCities),
}));

export const geoCitiesRelations = relations(geoCities, ({ one }) => ({
  state: one(geoStates, {
    fields: [geoCities.stateId],
    references: [geoStates.id],
  }),
}));

// ── Relations de Cargos/Permissões ────────────────────────────────────────────

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
    permission: one(permissions, {
      fields: [userPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  userRole: one(roles, { fields: [users.roleId], references: [roles.id] }),
  country: one(geoCountries, {
    fields: [users.countryId],
    references: [geoCountries.id],
  }),
  geoState: one(geoStates, {
    fields: [users.geoStateId],
    references: [geoStates.id],
  }),
  geoCity: one(geoCities, {
    fields: [users.geoCityId],
    references: [geoCities.id],
  }),
  notifications: many(notifications),
  classifieds: many(classifieds),
  classifiedComments: many(classifiedComments),
  userPermissions: many(userPermissions),
  subscriptions: many(subscriptions),
  quoteSubscriptions: many(userQuoteSubscriptions),
}));
