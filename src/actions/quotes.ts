"use server";

import { db } from "@/db";
import { quotes, products, regions, sources } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export type QuoteRow = {
  id: number;
  productSlug: string;
  productName: string;
  unit: string;
  category: string;
  regionName: string;
  state: string;
  city: string;
  price: number;
  variation: number | null;
  quoteDate: string;
};

export async function getTodayQuotes(): Promise<QuoteRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: quotes.id,
      productSlug: products.slug,
      productName: products.name,
      unit: products.unit,
      category: products.category,
      regionName: regions.name,
      state: regions.state,
      city: regions.city,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(regions, eq(quotes.regionId, regions.id))
    .innerJoin(sources, eq(quotes.sourceId, sources.id))
    .where(eq(quotes.quoteDate, today))
    .orderBy(products.category, products.name, regions.state);
  return rows;
}

export async function getQuotesByCategory(
  category: string,
): Promise<QuoteRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: quotes.id,
      productSlug: products.slug,
      productName: products.name,
      unit: products.unit,
      category: products.category,
      regionName: regions.name,
      state: regions.state,
      city: regions.city,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(regions, eq(quotes.regionId, regions.id))
    .where(and(eq(products.category, category), eq(quotes.quoteDate, today)))
    .orderBy(products.name, regions.state);
  return rows;
}

export type HistoryPoint = { date: string; price: number };

export async function getQuoteHistory(
  productSlug: string,
  state: string,
): Promise<HistoryPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select({
      quoteDate: quotes.quoteDate,
      price: quotes.price,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(regions, eq(quotes.regionId, regions.id))
    .where(
      and(
        eq(products.slug, productSlug),
        eq(regions.state, state),
        gte(quotes.quoteDate, sinceStr),
      ),
    )
    .orderBy(quotes.quoteDate);

  // average per day
  const map = new Map<string, number[]>();
  for (const r of rows) {
    const arr = map.get(r.quoteDate) ?? [];
    arr.push(r.price);
    map.set(r.quoteDate, arr);
  }
  return Array.from(map.entries()).map(([date, prices]) => ({
    date,
    price:
      Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) /
      100,
  }));
}

export async function getProductQuotes(
  productSlug: string,
): Promise<{ today: QuoteRow[]; history: HistoryPoint[] }> {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const todayRows = await db
    .select({
      id: quotes.id,
      productSlug: products.slug,
      productName: products.name,
      unit: products.unit,
      category: products.category,
      regionName: regions.name,
      state: regions.state,
      city: regions.city,
      price: quotes.price,
      variation: quotes.variation,
      quoteDate: quotes.quoteDate,
    })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .innerJoin(regions, eq(quotes.regionId, regions.id))
    .where(and(eq(products.slug, productSlug), eq(quotes.quoteDate, today)))
    .orderBy(regions.state);

  const histRows = await db
    .select({ quoteDate: quotes.quoteDate, price: quotes.price })
    .from(quotes)
    .innerJoin(products, eq(quotes.productId, products.id))
    .where(and(eq(products.slug, productSlug), gte(quotes.quoteDate, sinceStr)))
    .orderBy(quotes.quoteDate);

  const map = new Map<string, number[]>();
  for (const r of histRows) {
    const arr = map.get(r.quoteDate) ?? [];
    arr.push(r.price);
    map.set(r.quoteDate, arr);
  }
  const history = Array.from(map.entries()).map(([date, prices]) => ({
    date,
    price:
      Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) /
      100,
  }));

  return { today: todayRows, history };
}
