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

// Mapa de nomes de região do Scot Consultoria → slugs do banco de dados.
// Só inclui entradas com correspondência geográfica clara.
const SCOT_REGION_MAP: Record<string, string> = {
  "ms c. grande": "ms-campo-grande",
  "ms dourados": "ms-dourados",
  "mt cuiabá": "mt-cuiaba",
  "mt cuiabá*": "mt-cuiaba",
  "mt sudeste": "mt-rondonopolis",
  "go goiânia": "go-goiania",
  "mg triângulo": "mg-uberlandia",
  "pr noroeste": "pr-maringa",
};

async function scrapeScotConsultoria(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  for (const productSlug of ["boi-gordo", "vaca-gorda"]) {
    const html = await fetchHtml(
      `https://www.scotconsultoria.com.br/cotacoes/${productSlug}/`,
    );
    const $ = cheerio.load(html);

    // Localiza a tabela "Mercado Físico" procurando pelo texto no thead
    let targetTable: ReturnType<typeof $> | null = null;
    $("table").each((_, table) => {
      if ($(table).find("thead th").text().includes("Mercado F")) {
        targetTable = $(table);
        return false; // break
      }
    });
    if (!targetTable) continue;

    // biome-ignore lint/suspicious/noExplicitAny: cheerio type workaround
    (targetTable as any).find("tr.conteudo").each((_: number, tr: any) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const regionText = $(cells.eq(0)).text().trim().toLowerCase();
      const priceText = $(cells.eq(1))
        .text()
        .replace(/,/g, ".")
        .replace(/[^\d.]/g, "");
      const price = parseFloat(priceText);
      if (Number.isNaN(price)) return;
      const regionSlug = SCOT_REGION_MAP[regionText];
      if (!regionSlug) return;
      results.push({ productSlug, regionSlug, price });
    });
  }

  return results;
}

// Mapa cidade → slug do banco para o Notícias Agrícolas
const NA_REGION_MAP: Record<string, string> = {
  "campo grande": "ms-campo-grande",
  dourados: "ms-dourados",
  maringá: "pr-maringa",
};

async function scrapeNoticiasAgricolas(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  const pages = [
    {
      productSlug: "soja",
      url: "https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms",
    },
    {
      productSlug: "milho",
      url: "https://www.noticiasagricolas.com.br/cotacoes/milho/milho-mercado-fisico-ms",
    },
  ];

  for (const { productSlug, url } of pages) {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    // O site exibe várias tabelas (uma por dia); a primeira é a mais recente.
    // Classe correta: "cot-fisicas" (e não "cot-fisicos")
    const firstTable = $("table.cot-fisicas").first();
    if (!firstTable.length) continue;

    firstTable.find("tbody tr").each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const regionText = $(cells.eq(0)).text().trim().toLowerCase();
      const priceText = $(cells.eq(1))
        .text()
        .replace(/,/g, ".")
        .replace(/[^\d.]/g, "");
      const price = parseFloat(priceText);
      if (Number.isNaN(price)) return;
      const regionSlug = NA_REGION_MAP[regionText];
      if (!regionSlug) return;

      let variation: number | undefined;
      if (cells.length > 2) {
        const varText = $(cells.eq(2))
          .text()
          .replace(/,/g, ".")
          .replace(/[^\d.+-]/g, "");
        const parsed = parseFloat(varText);
        if (!Number.isNaN(parsed)) variation = parsed;
      }

      results.push({ productSlug, regionSlug, price, variation });
    });
  }

  return results;
}

// ── Orquestração ────────────────────────────────────────────────────

// Agrolink exibe preços via sprites CSS — não scrapeable com HTML parser.
// A fonte deve estar marcada como inativa (active = 0) no banco de dados.
const SCRAPERS: Record<string, () => Promise<RawQuote[]>> = {
  scotconsultoria: scrapeScotConsultoria,
  noticiasagricolas: scrapeNoticiasAgricolas,
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

    // Evitar duplicatas para o mesmo produto/região/fonte/data.
    // Se já existir (ex.: dado antigo do seed), atualiza com o preço real.
    const [existing] = await db
      .select({ id: quotes.id })
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

    if (existing) {
      await db
        .update(quotes)
        .set({ price: row.price, variation: row.variation ?? null })
        .where(eq(quotes.id, existing.id));
    } else {
      await db.insert(quotes).values({
        productId: product.id,
        regionId: region.id,
        sourceId,
        price: row.price,
        variation: row.variation,
        quoteDate: dateStr,
      });
    }
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
      console.log(`[${source.slug}] ${inserted} cotações processadas.`);

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
