"use server";

import { db } from "@/db";
import { quotes, products, cities, states, sources } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export type QuoteRow = {
  id: number;
  cityId: number;
  productSlug: string;
  productName: string;
  unit: string;
  category: string;
  city: string;
  state: string;  // state code, e.g. "MS"
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

const BASE_SELECT = {
  id: quotes.id,
  cityId: cities.id,
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
  const date = await latestQuoteDate();
  return db
    .select(BASE_SELECT)
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(cities, eq(quotes.cityId, cities.id))
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(eq(quotes.quoteDate, date))
    .orderBy(products.category, products.name, states.code, cities.name);
}

export async function getQuotesByCategory(
  category: string,
): Promise<QuoteRow[]> {
  const date = await latestQuoteDate();
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
    .where(
      and(eq(products.slug, productSlug), gte(quotes.quoteDate, sinceStr)),
    )
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
    cityMap.get(row.cityId)!.points.push({ date: row.quoteDate, price: row.price });
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
export async function getStatesForProduct(productSlug: string): Promise<StateOption[]> {
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

