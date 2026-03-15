import * as cheerio from "cheerio";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { quotes, sources, products, cities, states, scraperLogs } from "@/db/schema";

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

export function shouldSkipToday(): boolean {
  const now = new Date();
  const dow = now.getDay();
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

/** Remove acentos e normaliza para minúsculas — torna mapeamentos robustos */
function norm(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Converte data brasileira "DD/MM/YYYY" → "YYYY-MM-DD" */
function parseBrazilianDate(text: string): string | undefined {
  const m = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!m) return undefined;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Extrai a data de uma tabela buscando nas células de cabeçalho e corpo */
function extractTableDate(
  $: ReturnType<typeof cheerio.load>,
  table: ReturnType<ReturnType<typeof cheerio.load>>,
): string | undefined {
  for (const sel of ["caption", "thead th", "thead td", "tbody td"]) {
    let found: string | undefined;
    table.find(sel).each((_, el) => {
      const d = parseBrazilianDate($(el).text());
      if (d) {
        found = d;
        return false; // break
      }
    });
    if (found) return found;
  }
  return undefined;
}

/** Busca valor no mapa usando normalização em ambos os lados */
function lookupInMap<T>(
  map: Record<string, T>,
  text: string,
): T | undefined {
  const t = norm(text);
  for (const [key, val] of Object.entries(map)) {
    if (norm(key) === t) return val;
  }
  // fallback: correspondência parcial (ex: "Cuiabá*" → "cuiaba")
  for (const [key, val] of Object.entries(map)) {
    const k = norm(key);
    if (t.startsWith(k) || k.startsWith(t)) return val;
  }
  return undefined;
}

// ── Parsers por fonte ─────────────────────────────────────────────────────────

export interface RawQuote {
  productSlug: string;
  /** Nome da cidade extraído da tabela da fonte */
  city: string;
  /** Sigla do estado, ex: "MS", "MT" */
  state: string;
  price: number;
  variation?: number;
  /** Data extraída da própria tabela ("YYYY-MM-DD"). Sobrescreve a data de fallback. */
  date?: string;
}

// ── Scot Consultoria (pecuária) ───────────────────────────────────────────────

const SCOT_REGION_MAP: Record<string, { city: string; state: string }> = {
  // Mato Grosso do Sul
  "ms c. grande":    { city: "Campo Grande",  state: "MS" },
  "ms campo grande": { city: "Campo Grande",  state: "MS" },
  "ms dourados":     { city: "Dourados",      state: "MS" },
  "ms tres lagoas":  { city: "Três Lagoas",   state: "MS" },
  "ms 3 lagoas":     { city: "Três Lagoas",   state: "MS" },
  "ms maracaju":     { city: "Maracaju",      state: "MS" },
  // Mato Grosso
  "mt cuiaba":   { city: "Cuiabá",       state: "MT" },
  "mt sudeste":  { city: "Rondonópolis", state: "MT" },
  "mt noroeste": { city: "Sorriso",      state: "MT" },
  "mt sinop":    { city: "Sinop",        state: "MT" },
  // Goiás
  "go goiania":   { city: "Goiânia",   state: "GO" },
  "go rio verde": { city: "Rio Verde", state: "GO" },
  // Minas Gerais
  "mg triangulo": { city: "Uberlândia", state: "MG" },
  "mg zebu":      { city: "Uberaba",    state: "MG" },
  "mg uberaba":   { city: "Uberaba",    state: "MG" },
  // São Paulo
  "sp barretos":            { city: "Barretos",             state: "SP" },
  "sp aracatuba":           { city: "Araçatuba",            state: "SP" },
  "sp presidente prudente": { city: "Presidente Prudente",  state: "SP" },
  "sp ribeirao preto":      { city: "Ribeirão Preto",       state: "SP" },
  "sp s.j. rio preto":      { city: "São José do Rio Preto", state: "SP" },
  "sp sao jose rio preto":  { city: "São José do Rio Preto", state: "SP" },
  // Paraná
  "pr noroeste": { city: "Maringá",  state: "PR" },
  "pr norte":    { city: "Londrina", state: "PR" },
  "pr cascavel": { city: "Cascavel", state: "PR" },
  // Tocantins
  "to araguaina": { city: "Araguaína", state: "TO" },
  // Pará
  "pa maraba": { city: "Marabá", state: "PA" },
  "pa belem":  { city: "Marabá", state: "PA" },
  // Bahia
  "ba barreiras": { city: "Barreiras", state: "BA" },
  // Rondônia
  "ro vilhena":  { city: "Vilhena",   state: "RO" },
  "ro ji-parana":{ city: "Ji-Paraná", state: "RO" },
};

async function scrapeScotConsultoria(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  for (const productSlug of ["boi-gordo", "vaca-gorda"]) {
    const html = await fetchHtml(
      `https://www.scotconsultoria.com.br/cotacoes/${productSlug}/`,
    );
    const $ = cheerio.load(html);

    let targetTable: ReturnType<typeof $> | null = null;
    $("table").each((_, table) => {
      if ($(table).find("thead th").text().includes("Mercado F")) {
        targetTable = $(table);
        return false;
      }
    });
    if (!targetTable) continue;

    // Extrai a data da tabela (busca em caption, th e td)
    // biome-ignore lint/suspicious/noExplicitAny: cheerio type workaround
    const tableDate = extractTableDate($, targetTable as any);

    // biome-ignore lint/suspicious/noExplicitAny: cheerio type workaround
    (targetTable as any).find("tr.conteudo").each((_: number, tr: any) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const regionText = $(cells.eq(0)).text().trim();
      const priceText = $(cells.eq(1))
        .text()
        .replace(/,/g, ".")
        .replace(/[^\d.]/g, "");
      const price = parseFloat(priceText);
      if (Number.isNaN(price)) return;

      const regionInfo = lookupInMap(SCOT_REGION_MAP, regionText);
      if (!regionInfo) return;

      // Data pode vir em uma célula da própria linha; caso contrário usa a da tabela
      const rowDate = parseBrazilianDate($(tr).text()) ?? tableDate;

      results.push({
        productSlug,
        city: regionInfo.city,
        state: regionInfo.state,
        price,
        date: rowDate,
      });
    });
  }

  return results;
}

// ── Notícias Agrícolas (grãos — múltiplos estados) ────────────────────────────

interface NAPage {
  productSlug: string;
  stateCode: string;
  /** Mapa: nome normalizado da praça → nome canônico (igual ao campo city do banco) */
  regionMap: Record<string, string>;
}

const NA_PAGES: NAPage[] = [
  // ── Soja ──
  {
    productSlug: "soja", stateCode: "ms",
    regionMap: {
      "campo grande": "Campo Grande",
      "dourados":     "Dourados",
      "maracaju":     "Maracaju",
    },
  },
  {
    productSlug: "soja", stateCode: "mt",
    regionMap: {
      "cuiaba":             "Cuiabá",
      "sorriso":            "Sorriso",
      "sinop":              "Sinop",
      "rondonopolis":       "Rondonópolis",
      "lucas do rio verde": "Lucas do Rio Verde",
      "campo verde":        "Campo Verde",
      "nova mutum":         "Nova Mutum",
    },
  },
  {
    productSlug: "soja", stateCode: "pr",
    regionMap: {
      "cascavel":     "Cascavel",
      "maringa":      "Maringá",
      "londrina":     "Londrina",
      "ponta grossa": "Ponta Grossa",
      "paranagua":    "Paranaguá",
    },
  },
  {
    productSlug: "soja", stateCode: "go",
    regionMap: {
      "goiania":   "Goiânia",
      "rio verde": "Rio Verde",
      "jatai":     "Jataí",
    },
  },
  {
    productSlug: "soja", stateCode: "sp",
    regionMap: {
      "sao paulo":           "São Paulo",
      "ribeirao preto":      "Ribeirão Preto",
      "presidente prudente": "Presidente Prudente",
      "campinas":            "Campinas",
    },
  },
  {
    productSlug: "soja", stateCode: "rs",
    regionMap: {
      "passo fundo":  "Passo Fundo",
      "cruz alta":    "Cruz Alta",
      "santa rosa":   "Santa Rosa",
      "porto alegre": "Porto Alegre",
      "ijui":         "Ijuí",
    },
  },
  {
    productSlug: "soja", stateCode: "mg",
    regionMap: {
      "uberlandia":     "Uberlândia",
      "uberaba":        "Uberaba",
      "patos de minas": "Patos de Minas",
    },
  },
  {
    productSlug: "soja", stateCode: "ba",
    regionMap: {
      "barreiras":              "Barreiras",
      "luis eduardo magalhaes": "Luís Eduardo Magalhães",
      "l. e. magalhaes":        "Luís Eduardo Magalhães",
      "lem":                    "Luís Eduardo Magalhães",
    },
  },
  {
    productSlug: "soja", stateCode: "ma",
    regionMap: { "balsas": "Balsas" },
  },
  {
    productSlug: "soja", stateCode: "sc",
    regionMap: {
      "chapeco":  "Chapecó",
      "xanxere":  "Xanxerê",
      "lages":    "Lages",
    },
  },
  {
    productSlug: "soja", stateCode: "to",
    regionMap: {
      "palmas":       "Palmas",
      "gurupi":       "Gurupi",
      "pedro afonso": "Pedro Afonso",
    },
  },
  {
    productSlug: "soja", stateCode: "pa",
    regionMap: {
      "santarem":    "Santarém",
      "paragominas": "Paragominas",
    },
  },
  // ── Milho ──
  {
    productSlug: "milho", stateCode: "ms",
    regionMap: {
      "campo grande": "Campo Grande",
      "dourados":     "Dourados",
      "maracaju":     "Maracaju",
    },
  },
  {
    productSlug: "milho", stateCode: "mt",
    regionMap: {
      "cuiaba":       "Cuiabá",
      "sorriso":      "Sorriso",
      "sinop":        "Sinop",
      "rondonopolis": "Rondonópolis",
    },
  },
  {
    productSlug: "milho", stateCode: "pr",
    regionMap: {
      "cascavel":     "Cascavel",
      "maringa":      "Maringá",
      "londrina":     "Londrina",
      "ponta grossa": "Ponta Grossa",
    },
  },
  {
    productSlug: "milho", stateCode: "go",
    regionMap: {
      "goiania":   "Goiânia",
      "rio verde": "Rio Verde",
    },
  },
  {
    productSlug: "milho", stateCode: "sp",
    regionMap: {
      "sao paulo":      "São Paulo",
      "ribeirao preto": "Ribeirão Preto",
      "campinas":       "Campinas",
    },
  },
  {
    productSlug: "milho", stateCode: "rs",
    regionMap: {
      "passo fundo": "Passo Fundo",
      "cruz alta":   "Cruz Alta",
      "santa rosa":  "Santa Rosa",
    },
  },
  {
    productSlug: "milho", stateCode: "mg",
    regionMap: {
      "uberlandia": "Uberlândia",
      "sete lagoas": "Sete Lagoas",
    },
  },
];

async function scrapeNoticiasAgricolas(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  for (const page of NA_PAGES) {
    const url = `https://www.noticiasagricolas.com.br/cotacoes/${page.productSlug}/${page.productSlug}-mercado-fisico-${page.stateCode}`;

    let html: string;
    try {
      html = await fetchHtml(url);
    } catch {
      // página pode não existir para este estado/produto — pula silenciosamente
      continue;
    }

    const $ = cheerio.load(html);
    const firstTable = $("table.cot-fisicas").first();
    if (!firstTable.length) continue;

    // Extrai a data da tabela (busca em caption, th e td)
    const tableDate = extractTableDate($, firstTable);

    firstTable.find("tbody tr").each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const cellText = $(cells.eq(0)).text().trim();
      // Resolve nome canônico da cidade pelo mapa (filtra linhas inválidas)
      const canonicalCity = lookupInMap(page.regionMap, cellText);
      if (!canonicalCity) return;

      const priceText = $(cells.eq(1))
        .text()
        .replace(/,/g, ".")
        .replace(/[^\d.]/g, "");
      const price = parseFloat(priceText);
      if (Number.isNaN(price) || price <= 0) return;

      let variation: number | undefined;
      if (cells.length > 2) {
        const varText = $(cells.eq(2))
          .text()
          .replace(/,/g, ".")
          .replace(/[^\d.+-]/g, "");
        const parsed = parseFloat(varText);
        if (!Number.isNaN(parsed)) variation = parsed;
      }

      // Data pode vir em uma célula da própria linha; caso contrário usa a da tabela
      const rowDate = parseBrazilianDate($(tr).text()) ?? tableDate;

      results.push({
        productSlug: page.productSlug,
        city: canonicalCity,
        state: page.stateCode.toUpperCase(),
        price,
        variation,
        date: rowDate,
      });
    });
  }

  return results;
}

// ── Persistência com dedup (produto + região + data) ─────────────────────────

const SCRAPERS: Record<string, () => Promise<RawQuote[]>> = {
  scotconsultoria:   scrapeScotConsultoria,
  noticiasagricolas: scrapeNoticiasAgricolas,
};

async function persistQuotes(
  rows: RawQuote[],
  sourceId: number,
  fallbackDate: string,
): Promise<number> {
  let inserted = 0;

  // Pré-carrega cidades com seus estados para evitar N+1 queries
  const allCities = await db
    .select({
      id: cities.id,
      name: cities.name,
      stateCode: states.code,
    })
    .from(cities)
    .innerJoin(states, eq(cities.stateId, states.id));

  const cityStateMap = new Map<string, typeof allCities[0]>();
  const stateMap = new Map<string, typeof allCities[0]>();

  for (const c of allCities) {
    cityStateMap.set(`${c.stateCode}:${norm(c.name)}`, c);
    if (!stateMap.has(c.stateCode)) stateMap.set(c.stateCode, c);
  }

  for (const row of rows) {
    const dateStr = row.date ?? fallbackDate;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, row.productSlug))
      .limit(1);
    if (!product) continue;

    const stateUp = row.state.toUpperCase();
    const city =
      cityStateMap.get(`${stateUp}:${norm(row.city)}`) ??
      stateMap.get(stateUp);
    if (!city) continue;

    // Dedup: uma cotação por (produto, cidade, data) — fonte de maior prioridade vence
    const [existing] = await db
      .select({ id: quotes.id, sourceId: quotes.sourceId })
      .from(quotes)
      .where(
        and(
          eq(quotes.productId, product.id),
          eq(quotes.cityId, city.id),
          eq(quotes.quoteDate, dateStr),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.sourceId === sourceId) {
        await db
          .update(quotes)
          .set({ price: row.price, variation: row.variation ?? null })
          .where(eq(quotes.id, existing.id));
        inserted++;
      }
      continue;
    }

    await db.insert(quotes).values({
      productId: product.id,
      cityId: city.id,
      sourceId,
      price: row.price,
      variation: row.variation,
      quoteDate: dateStr,
    });
    inserted++;
  }

  return inserted;
}

// ── Orquestração ──────────────────────────────────────────────────────────────

export interface ScrapeResult {
  source: string;
  status: "success" | "error" | "skipped";
  quotesInserted: number;
  error?: string;
}

export async function runFullScrape(options?: {
  force?: boolean;
}): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  if (!options?.force && shouldSkipToday()) {
    await db.insert(scraperLogs).values({
      status: "skipped",
      quotesInserted: 0,
    });
    return [{ source: "all", status: "skipped", quotesInserted: 0 }];
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
      const rows = await scraper();
      const inserted = await persistQuotes(rows, source.id, dateStr);

      await db.insert(scraperLogs).values({
        sourceId: source.id,
        status: "success",
        quotesInserted: inserted,
      });

      results.push({
        source: source.name,
        status: "success",
        quotesInserted: inserted,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.insert(scraperLogs).values({
        sourceId: source.id,
        status: "error",
        quotesInserted: 0,
        errorMessage: message,
      });

      results.push({
        source: source.name,
        status: "error",
        quotesInserted: 0,
        error: message,
      });
    }
  }

  return results;
}


