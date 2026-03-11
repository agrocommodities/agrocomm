import "dotenv/config";
import * as cheerio from "cheerio";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import { quotes, sources, products, regions, scraperLogs } from "./schema";

const db = drizzle(process.env.DB_FILE_NAME!);

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isBrazilianHoliday(date: Date): boolean {
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const fixed = [
    [1, 1],
    [4, 21],
    [5, 1],
    [9, 7],
    [10, 12],
    [11, 2],
    [11, 15],
    [12, 25],
  ];
  return fixed.some(([m, d]) => m === mm && d === dd);
}

function shouldSkipToday(): boolean {
  const now = new Date();
  const dow = now.getDay(); // 0=dom, 6=sab
  return dow === 0 || dow === 6 || isBrazilianHoliday(now);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AgroCommBot/1.0)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  return res.text();
}

// ── Parsers por fonte ─────────────────────────────────────────────────────────

interface RawQuote {
  productSlug: string;
  regionSlug: string;
  price: number;
  variation?: number;
}

async function scrapeScotConsultoria(): Promise<RawQuote[]> {
  const html = await fetchHtml(
    "https://www.scotconsultoria.com.br/cotacoes/?ref=mnp",
  );
  const $ = cheerio.load(html);
  const rows: RawQuote[] = [];

  $("table.tabela-cotacao tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 3) return;
    const name = $(cells[0]).text().trim().toLowerCase();
    const priceText = $(cells[1])
      .text()
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const variationText = $(cells[2])
      .text()
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const price = parseFloat(priceText);
    if (Number.isNaN(price)) return;
    rows.push({
      productSlug: name.includes("boi") ? "boi-gordo" : "vaca-gorda",
      regionSlug: "sp",
      price,
      variation: parseFloat(variationText) || undefined,
    });
  });

  return rows;
}

async function scrapeNoticiasAgricolas(): Promise<RawQuote[]> {
  const html = await fetchHtml(
    "https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms",
  );
  const $ = cheerio.load(html);
  const rows: RawQuote[] = [];

  $("table.cot-fisicos tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 2) return;
    const regionText = $(cells[0]).text().trim().toLowerCase();
    const priceText = $(cells[1])
      .text()
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const price = parseFloat(priceText);
    if (Number.isNaN(price)) return;
    rows.push({ productSlug: "soja", regionSlug: slugify(regionText), price });
  });

  return rows;
}

async function scrapeAgrolink(): Promise<RawQuote[]> {
  const html = await fetchHtml(
    "https://www.agrolink.com.br/cotacoes/graos/soja",
  );
  const $ = cheerio.load(html);
  const rows: RawQuote[] = [];

  $("table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 2) return;
    const regionText = $(cells[0]).text().trim();
    const priceText = $(cells[1])
      .text()
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const price = parseFloat(priceText);
    if (Number.isNaN(price)) return;
    rows.push({ productSlug: "soja", regionSlug: slugify(regionText), price });
  });

  return rows;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Orquestração ──────────────────────────────────────────────────────────────

const SCRAPERS: Record<string, () => Promise<RawQuote[]>> = {
  scotconsultoria: scrapeScotConsultoria,
  noticiasagricolas: scrapeNoticiasAgricolas,
  agrolink: scrapeAgrolink,
};

async function persistQuotes(
  rows: RawQuote[],
  sourceId: number,
  dateStr: string,
): Promise<number> {
  let inserted = 0;

  for (const row of rows) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, row.productSlug))
      .limit(1);
    if (!product) continue;

    const [region] = await db
      .select()
      .from(regions)
      .where(eq(regions.slug, row.regionSlug))
      .limit(1);
    if (!region) continue;

    // Evitar duplicatas para o mesmo produto/região/fonte/data
    const [existing] = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.productId, product.id),
          eq(quotes.regionId, region.id),
          eq(quotes.sourceId, sourceId),
          eq(quotes.quoteDate, dateStr),
        ),
      )
      .limit(1);

    if (existing) continue;

    await db.insert(quotes).values({
      productId: product.id,
      regionId: region.id,
      sourceId,
      price: row.price,
      variation: row.variation,
      quoteDate: dateStr,
    });
    inserted++;
  }

  return inserted;
}

async function main() {
  if (shouldSkipToday()) {
    console.log("Scraping ignorado: final de semana ou feriado.");
    await db.insert(scraperLogs).values({
      status: "skipped",
      quotesInserted: 0,
    });
    return;
  }

  const dateStr = today();
  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.active, 1))
    .orderBy(sources.priority);

  for (const source of allSources) {
    const scraper = SCRAPERS[source.slug];
    if (!scraper) continue;

    try {
      console.log(`[${source.slug}] Iniciando scraping…`);
      const rows = await scraper();
      const inserted = await persistQuotes(rows, source.id, dateStr);
      console.log(`[${source.slug}] ${inserted} cotações inseridas.`);

      await db.insert(scraperLogs).values({
        sourceId: source.id,
        status: "success",
        quotesInserted: inserted,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${source.slug}] Erro: ${message}`);
      await db.insert(scraperLogs).values({
        sourceId: source.id,
        status: "error",
        quotesInserted: 0,
        errorMessage: message,
      });
    }
  }
}

main();
