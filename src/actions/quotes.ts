"use server";

import { db } from "@/db";
import {
  quotes,
  products,
  cities,
  states,
  sources,
  chicagoQuotes,
} from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export type QuoteRow = {
  id: number;
  productId: number;
  cityId: number;
  citySlug: string;
  productSlug: string;
  productName: string;
  unit: string;
  category: string;
  city: string;
  state: string; // state code, e.g. "MS"
  stateName: string;
  price: number;
  variation: number | null;
  quoteDate: string;
};

export type HistoryPoint = { date: string; price: number };

export type CityLine = {
  cityId: number;
  city: string;
  state: string;
  points: HistoryPoint[];
};

export type StateOption = { code: string; name: string };
export type CityOption = { id: number; name: string; slug: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retorna a data mais recente com cotações no banco (fallback para hoje) */
async function latestQuoteDate(): Promise<string> {
  const [row] = await db
    .select({ d: quotes.quoteDate })
    .from(quotes)
    .orderBy(desc(quotes.quoteDate))
    .limit(1);
  return row?.d ?? new Date().toISOString().slice(0, 10);
}

/** Retorna a data mais recente para uma categoria específica */
async function latestQuoteDateForCategory(category: string): Promise<string> {
  const [row] = await db
    .select({ d: quotes.quoteDate })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(eq(products.category, category))
    .orderBy(desc(quotes.quoteDate))
    .limit(1);
  return row?.d ?? new Date().toISOString().slice(0, 10);
}

const BASE_SELECT = {
  id: quotes.id,
  productId: products.id,
  cityId: cities.id,
  citySlug: cities.slug,
  productSlug: products.slug,
  productName: products.name,
  unit: products.unit,
  category: products.category,
  city: cities.name,
  state: states.code,
  stateName: states.name,
  price: quotes.price,
  variation: quotes.variation,
  quoteDate: quotes.quoteDate,
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getTodayQuotes(): Promise<QuoteRow[]> {
  // Cada categoria pode ter uma data mais recente diferente
  // (ex: grãos atualiza em dia diferente de pecuária)
  const [graosDate, pecuariaDate] = await Promise.all([
    latestQuoteDateForCategory("graos"),
    latestQuoteDateForCategory("pecuaria"),
  ]);

  const dates = [...new Set([graosDate, pecuariaDate])];

  return db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(
      dates.length === 1
        ? eq(quotes.quoteDate, dates[0])
        : sql`(${products.category} = 'graos' AND ${quotes.quoteDate} = ${graosDate})
           OR (${products.category} = 'pecuaria' AND ${quotes.quoteDate} = ${pecuariaDate})`,
    )
    .orderBy(products.category, products.name, states.code, cities.name);
}

export async function getQuotesByCategory(
  category: string,
): Promise<QuoteRow[]> {
  const date = await latestQuoteDateForCategory(category);
  return db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(and(eq(products.category, category), eq(quotes.quoteDate, date)))
    .orderBy(products.name, states.code, cities.name);
}

/**
 * Histórico 30 dias de TODAS as cidades de um produto.
 * Usado no gráfico multi-linha.
 */
export async function getProductCityHistories(
  productSlug: string,
): Promise<CityLine[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select({
      cityId: cities.id,
      city: cities.name,
      state: states.code,
      quoteDate: quotes.quoteDate,
      price: quotes.price,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(and(eq(products.slug, productSlug), gte(quotes.quoteDate, sinceStr)))
    .orderBy(quotes.quoteDate, states.code, cities.name);

  const cityMap = new Map<number, CityLine>();
  for (const row of rows) {
    if (!cityMap.has(row.cityId)) {
      cityMap.set(row.cityId, {
        cityId: row.cityId,
        city: row.city,
        state: row.state,
        points: [],
      });
    }
    cityMap
      .get(row.cityId)!
      .points.push({ date: row.quoteDate, price: row.price });
  }

  return Array.from(cityMap.values()).filter((l) => l.points.length > 0);
}

/** Histórico de uma cidade específica */
export async function getQuoteHistory(
  productSlug: string,
  cityId: number,
): Promise<HistoryPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  return db
    .select({ date: quotes.quoteDate, price: quotes.price })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(
      and(
        eq(products.slug, productSlug),
        eq(quotes.cityId, cityId),
        gte(quotes.quoteDate, sinceStr),
      ),
    )
    .orderBy(quotes.quoteDate);
}

/**
 * Histórico de uma cidade específica com range customizável.
 * @param days 0 = tudo, caso contrário quantidade de dias para trás
 */
export async function getCityHistoryByRange(
  productSlug: string,
  cityId: number,
  days: number,
): Promise<HistoryPoint[]> {
  const conditions = [
    eq(products.slug, productSlug),
    eq(quotes.cityId, cityId),
  ];

  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    conditions.push(gte(quotes.quoteDate, sinceStr));
  }

  return db
    .select({ date: quotes.quoteDate, price: quotes.price })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(and(...conditions))
    .orderBy(quotes.quoteDate);
}

export async function getProductQuotes(
  productSlug: string,
): Promise<{ today: QuoteRow[]; cityHistories: CityLine[] }> {
  const date = await latestQuoteDate();

  const today = await db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(and(eq(products.slug, productSlug), eq(quotes.quoteDate, date)))
    .orderBy(states.code, cities.name);

  const cityHistories = await getProductCityHistories(productSlug);

  return { today, cityHistories };
}

/** Returns distinct states that have quotes for the given product */
export async function getStatesForProduct(
  productSlug: string,
): Promise<StateOption[]> {
  const rows = await db
    .selectDistinct({ code: states.code, name: states.name })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(eq(products.slug, productSlug))
    .orderBy(states.code);
  return rows;
}

/** Returns cities in a state that have quotes for the given product */
export async function getCitiesForProduct(
  productSlug: string,
  stateCode: string,
): Promise<CityOption[]> {
  const rows = await db
    .selectDistinct({ id: cities.id, name: cities.name, slug: cities.slug })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .where(and(eq(products.slug, productSlug), eq(states.code, stateCode)))
    .orderBy(cities.name);
  return rows;
}

export async function getQuotesByDate(
  productSlug: string,
  date: string,
): Promise<QuoteRow[]> {
  return db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(and(eq(products.slug, productSlug), eq(quotes.quoteDate, date)))
    .orderBy(states.code, cities.name);
}

/** Returns dates that have quotes for a product in a given year/month */
export async function getAvailableQuoteDates(
  productSlug: string,
  year: number,
  month: number,
): Promise<string[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const rows = await db
    .selectDistinct({ date: quotes.quoteDate })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(
      and(
        eq(products.slug, productSlug),
        gte(quotes.quoteDate, startDate),
        sql`${quotes.quoteDate} < ${endDate}`,
      ),
    )
    .orderBy(quotes.quoteDate);
  return rows.map((r) => r.date);
}

/** Returns distinct years that have quotes for a product */
export async function getAvailableQuoteYears(
  productSlug: string,
): Promise<number[]> {
  const rows = await db
    .selectDistinct({
      year: sql<string>`substr(${quotes.quoteDate}, 1, 4)`,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(eq(products.slug, productSlug))
    .orderBy(sql`substr(${quotes.quoteDate}, 1, 4)`);
  return rows.map((r) => Number(r.year));
}

/** Returns quotes for a product between two dates */
export async function getQuotesByDateRange(
  productSlug: string,
  startDate: string,
  endDate: string,
): Promise<QuoteRow[]> {
  return db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(
      and(
        eq(products.slug, productSlug),
        gte(quotes.quoteDate, startDate),
        lte(quotes.quoteDate, endDate),
      ),
    )
    .orderBy(quotes.quoteDate, states.code, cities.name);
}

/**
 * Returns historical Chicago (CBOT) quotes for a given commodity key.
 * @param key commodity key, e.g. "soja", "milho", "boi"
 * @param days 0 = all, otherwise days back from today
 */
export async function getChicagoHistory(
  key: string,
  days: number,
): Promise<HistoryPoint[]> {
  const conditions = [eq(chicagoQuotes.key, key)];

  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    conditions.push(gte(chicagoQuotes.quoteDate, sinceStr));
  }

  const rows = await db
    .select({
      date: chicagoQuotes.quoteDate,
      price: chicagoQuotes.price,
    })
    .from(chicagoQuotes)
    .where(and(...conditions))
    .orderBy(chicagoQuotes.quoteDate);

  return rows;
}

/**
 * Returns historical Chicago (CBOT) quotes with a custom date range.
 * @param key commodity key
 * @param days number of days back
 */
export async function getChicagoHistoryByRange(
  key: string,
  days: number,
): Promise<HistoryPoint[]> {
  return getChicagoHistory(key, days);
}
