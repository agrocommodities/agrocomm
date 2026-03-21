import "dotenv/config";
import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element as DomElement } from "domhandler";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import {
  quotes,
  sources,
  products,
  cities,
  states,
  scraperLogs,
  newsArticles,
  quoteConflicts,
  newsSources,
} from "./schema";

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
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);
  return res.text();
}

// ── Helpers de normalização e data ───────────────────────────────────────────

/** Remove acentos e normaliza para minúsculas */
function norm(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Converte data brasileira "DD/MM/YYYY" ou "DD/MM" → "YYYY-MM-DD" */
function parseBrazilianDate(text: string): string | undefined {
  // DD/MM/YYYY
  const full = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (full) return `${full[3]}-${full[2]}-${full[1]}`;
  // DD/MM (sem ano — assume ano corrente)
  const short = text.match(/\b(\d{2})\/(\d{2})\b/);
  if (short) {
    const year = new Date().getFullYear();
    return `${year}-${short[2]}-${short[1]}`;
  }
  return undefined;
}

const MONTH_NAMES: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  "mar\u00e7o": "03",
  marco: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

/** Converte "13 de março de 2026" → "2026-03-13" */
function parseBrazilianTextDate(text: string): string | undefined {
  const m = text.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (!m) return undefined;
  const month = MONTH_NAMES[m[2]];
  if (!month) return undefined;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

/** Extrai a data de uma tabela buscando nas células de cabeçalho e corpo */
function extractTableDate(
  $: CheerioAPI,
  table: Cheerio<DomElement>,
): string | undefined {
  for (const sel of ["caption", "thead th", "thead td", "tbody td"]) {
    let found: string | undefined;
    table.find(sel).each((_, el) => {
      const t = $(el).text();
      const d = parseBrazilianDate(t) ?? parseBrazilianTextDate(t);
      if (d) {
        found = d;
        return false;
      }
    });
    if (found) return found;
  }
  return undefined;
}

/** Busca data na página fora da tabela (títulos, spans, parágrafos próximos) */
function extractPageDate($: CheerioAPI): string | undefined {
  for (const sel of [
    "h1",
    "h2",
    "h3",
    ".data",
    ".date",
    "time",
    "span.data",
    "p",
  ]) {
    let found: string | undefined;
    $(sel).each((_, el) => {
      const t = $(el).text();
      const d = parseBrazilianDate(t) ?? parseBrazilianTextDate(t);
      if (d) {
        found = d;
        return false;
      }
    });
    if (found) return found;
  }
  return undefined;
}

/** Busca valor no mapa usando normalização em ambos os lados */
function lookupInMap<T>(map: Record<string, T>, text: string): T | undefined {
  const t = norm(text);
  for (const [key, val] of Object.entries(map)) {
    if (norm(key) === t) return val;
  }
  for (const [key, val] of Object.entries(map)) {
    const k = norm(key);
    if (t.startsWith(k) || k.startsWith(t)) return val;
  }
  return undefined;
}

// ── Parsers por fonte ─────────────────────────────────────────────────────────

interface RawQuote {
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

const SCOT_REGION_MAP: Record<string, { city: string; state: string }> = {
  // São Paulo
  "sp barretos": { city: "Barretos", state: "SP" },
  "sp aracatuba": { city: "Araçatuba", state: "SP" },
  "sp presidente prudente": { city: "Presidente Prudente", state: "SP" },
  "sp ribeirao preto": { city: "Ribeirão Preto", state: "SP" },
  "sp s.j. rio preto": { city: "São José do Rio Preto", state: "SP" },
  "sp sao jose rio preto": { city: "São José do Rio Preto", state: "SP" },
  // Minas Gerais
  "mg triangulo": { city: "Uberlândia", state: "MG" },
  "mg b.horizonte": { city: "Belo Horizonte", state: "MG" },
  "mg belo horizonte": { city: "Belo Horizonte", state: "MG" },
  "mg norte": { city: "Montes Claros", state: "MG" },
  "mg sul": { city: "Varginha", state: "MG" },
  "mg zebu": { city: "Uberaba", state: "MG" },
  "mg uberaba": { city: "Uberaba", state: "MG" },
  // Goiás
  "go goiania": { city: "Goiânia", state: "GO" },
  "go rio verde": { city: "Rio Verde", state: "GO" },
  "go reg. sul": { city: "Jataí", state: "GO" },
  "go sul": { city: "Jataí", state: "GO" },
  // Mato Grosso do Sul
  "ms c. grande": { city: "Campo Grande", state: "MS" },
  "ms campo grande": { city: "Campo Grande", state: "MS" },
  "ms dourados": { city: "Dourados", state: "MS" },
  "ms tres lagoas": { city: "Três Lagoas", state: "MS" },
  "ms 3 lagoas": { city: "Três Lagoas", state: "MS" },
  "ms maracaju": { city: "Maracaju", state: "MS" },
  // Mato Grosso
  "mt cuiaba": { city: "Cuiabá", state: "MT" },
  "mt cuiaba*": { city: "Cuiabá", state: "MT" },
  "mt sudeste": { city: "Rondonópolis", state: "MT" },
  "mt sudoeste": { city: "Cáceres", state: "MT" },
  "mt noroeste": { city: "Sorriso", state: "MT" },
  "mt norte": { city: "Sinop", state: "MT" },
  "mt sinop": { city: "Sinop", state: "MT" },
  // Rio Grande do Sul
  "rs oeste": { city: "Ijuí", state: "RS" },
  "rs oeste (kg)": { city: "Ijuí", state: "RS" },
  "rs pelotas": { city: "Pelotas", state: "RS" },
  "rs pelotas (kg)": { city: "Pelotas", state: "RS" },
  // Paraná
  "pr noroeste": { city: "Maringá", state: "PR" },
  "pr norte": { city: "Londrina", state: "PR" },
  "pr cascavel": { city: "Cascavel", state: "PR" },
  // Santa Catarina
  sc: { city: "Chapecó", state: "SC" },
  // Tocantins
  "to sul": { city: "Gurupi", state: "TO" },
  "to norte": { city: "Araguaína", state: "TO" },
  "to araguaina": { city: "Araguaína", state: "TO" },
  // Pará
  "pa maraba": { city: "Marabá", state: "PA" },
  "pa redencao": { city: "Redenção", state: "PA" },
  "pa paragominas": { city: "Paragominas", state: "PA" },
  "pa belem": { city: "Belém", state: "PA" },
  // Bahia
  "ba barreiras": { city: "Barreiras", state: "BA" },
  "ba sul": { city: "Itapetinga", state: "BA" },
  "ba oeste": { city: "Barreiras", state: "BA" },
  // Maranhão
  "ma oeste": { city: "Balsas", state: "MA" },
  // Rondônia
  "ro vilhena": { city: "Vilhena", state: "RO" },
  "ro sudeste": { city: "Ji-Paraná", state: "RO" },
  "ro ji-parana": { city: "Ji-Paraná", state: "RO" },
  // Alagoas
  alagoas: { city: "Maceió", state: "AL" },
  // Acre
  acre: { city: "Rio Branco", state: "AC" },
  // Espírito Santo
  es: { city: "Vitória", state: "ES" },
  // Rio de Janeiro
  rj: { city: "Rio de Janeiro", state: "RJ" },
  // Roraima
  roraima: { city: "Boa Vista", state: "RR" },
};

async function scrapeScotConsultoria(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  for (const productSlug of ["boi-gordo", "vaca-gorda"]) {
    let html: string;
    try {
      html = await fetchHtml(
        `https://www.scotconsultoria.com.br/cotacoes/${productSlug}/`,
      );
    } catch {
      continue;
    }
    const $ = cheerio.load(html);

    let targetTable: Cheerio<DomElement> | null = null;
    $("table").each((_, table) => {
      if ($(table).find("thead th").text().includes("Mercado F")) {
        targetTable = $(table);
        return false;
      }
    });
    if (!targetTable) continue;
    const foundTable: Cheerio<DomElement> = targetTable;

    // Extrai a data da tabela (busca em caption, th e td), com fallback na página
    const tableDate = extractTableDate($, foundTable) ?? extractPageDate($);

    foundTable.find("tr.conteudo").each((_, tr) => {
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

      // RS exibe preços em R$/kg — converte para R$/arroba (1@ = 15kg)
      let finalPrice = price;
      if (regionText.toLowerCase().includes("(kg)")) {
        finalPrice = Math.round(price * 15 * 100) / 100;
      }

      // Data pode vir em uma célula da própria linha; caso contrário usa a da tabela
      const rowDate =
        parseBrazilianDate($(tr).text()) ??
        parseBrazilianTextDate($(tr).text()) ??
        tableDate;

      results.push({
        productSlug,
        city: regionInfo.city,
        state: regionInfo.state,
        price: finalPrice,
        date: rowDate,
      });
    });
  }

  return results;
}

interface NAPage {
  productSlug: string;
  stateCode: string;
  /** Caminho customizado de URL (ex: "feijao/feijao-carioca-nota-8") */
  urlPath?: string;
  /** Mapa: nome normalizado da praça → nome canônico OU { city, state } para páginas multi-estado */
  regionMap: Record<string, string | { city: string; state: string }>;
  /** Quando true, extrai cidade/estado automaticamente do formato "Cidade/UF (fonte)" */
  autoParseCity?: boolean;
}

const NA_PAGES: NAPage[] = [
  // ── Soja ──
  {
    productSlug: "soja",
    stateCode: "ms",
    regionMap: {
      "campo grande": "Campo Grande",
      dourados: "Dourados",
      maracaju: "Maracaju",
      sidrolandia: "Sidrolândia",
      "chapadao do sul": "Chapadão do Sul",
      "sao gabriel do oeste": "São Gabriel do Oeste",
      "rio brilhante": "Rio Brilhante",
    },
  },
  {
    productSlug: "soja",
    stateCode: "mt",
    regionMap: {
      cuiaba: "Cuiabá",
      sorriso: "Sorriso",
      sinop: "Sinop",
      rondonopolis: "Rondonópolis",
      "lucas do rio verde": "Lucas do Rio Verde",
      "campo verde": "Campo Verde",
      "nova mutum": "Nova Mutum",
    },
  },
  {
    productSlug: "soja",
    stateCode: "pr",
    regionMap: {
      cascavel: "Cascavel",
      maringa: "Maringá",
      londrina: "Londrina",
      "ponta grossa": "Ponta Grossa",
      paranagua: "Paranaguá",
    },
  },
  {
    productSlug: "soja",
    stateCode: "go",
    regionMap: {
      goiania: "Goiânia",
      "rio verde": "Rio Verde",
      jatai: "Jataí",
    },
  },
  {
    productSlug: "soja",
    stateCode: "sp",
    regionMap: {
      "sao paulo": "São Paulo",
      "ribeirao preto": "Ribeirão Preto",
      "presidente prudente": "Presidente Prudente",
      campinas: "Campinas",
    },
  },
  {
    productSlug: "soja",
    stateCode: "rs",
    regionMap: {
      "passo fundo": "Passo Fundo",
      "cruz alta": "Cruz Alta",
      "santa rosa": "Santa Rosa",
      "porto alegre": "Porto Alegre",
      ijui: "Ijuí",
    },
  },
  {
    productSlug: "soja",
    stateCode: "mg",
    regionMap: {
      uberlandia: "Uberlândia",
      uberaba: "Uberaba",
      "patos de minas": "Patos de Minas",
    },
  },
  {
    productSlug: "soja",
    stateCode: "ba",
    regionMap: {
      barreiras: "Barreiras",
      "luis eduardo magalhaes": "Luís Eduardo Magalhães",
      "l. e. magalhaes": "Luís Eduardo Magalhães",
      lem: "Luís Eduardo Magalhães",
    },
  },
  { productSlug: "soja", stateCode: "ma", regionMap: { balsas: "Balsas" } },
  {
    productSlug: "soja",
    stateCode: "sc",
    regionMap: {
      chapeco: "Chapecó",
      xanxere: "Xanxerê",
      lages: "Lages",
    },
  },
  {
    productSlug: "soja",
    stateCode: "to",
    regionMap: {
      palmas: "Palmas",
      gurupi: "Gurupi",
      "pedro afonso": "Pedro Afonso",
    },
  },
  {
    productSlug: "soja",
    stateCode: "pa",
    regionMap: {
      santarem: "Santarém",
      paragominas: "Paragominas",
    },
  },
  {
    productSlug: "soja",
    stateCode: "BR",
    urlPath: "soja/soja-mercado-fisico-sindicatos-e-cooperativas",
    autoParseCity: true,
    regionMap: {},
  },
  // ── Milho ──
  {
    productSlug: "milho",
    stateCode: "ms",
    regionMap: {
      "campo grande": "Campo Grande",
      dourados: "Dourados",
      maracaju: "Maracaju",
      sidrolandia: "Sidrolândia",
      "chapadao do sul": "Chapadão do Sul",
      "sao gabriel do oeste": "São Gabriel do Oeste",
      "rio brilhante": "Rio Brilhante",
    },
  },
  {
    productSlug: "milho",
    stateCode: "mt",
    regionMap: {
      cuiaba: "Cuiabá",
      sorriso: "Sorriso",
      sinop: "Sinop",
      rondonopolis: "Rondonópolis",
    },
  },
  {
    productSlug: "milho",
    stateCode: "pr",
    regionMap: {
      cascavel: "Cascavel",
      maringa: "Maringá",
      londrina: "Londrina",
      "ponta grossa": "Ponta Grossa",
    },
  },
  {
    productSlug: "milho",
    stateCode: "go",
    regionMap: {
      goiania: "Goiânia",
      "rio verde": "Rio Verde",
    },
  },
  {
    productSlug: "milho",
    stateCode: "sp",
    regionMap: {
      "sao paulo": "São Paulo",
      "ribeirao preto": "Ribeirão Preto",
      campinas: "Campinas",
    },
  },
  {
    productSlug: "milho",
    stateCode: "rs",
    regionMap: {
      "passo fundo": "Passo Fundo",
      "cruz alta": "Cruz Alta",
      "santa rosa": "Santa Rosa",
    },
  },
  {
    productSlug: "milho",
    stateCode: "mg",
    regionMap: {
      uberlandia: "Uberlândia",
      "sete lagoas": "Sete Lagoas",
    },
  },
  {
    productSlug: "milho",
    stateCode: "ba",
    regionMap: {
      barreiras: "Barreiras",
      "luis eduardo magalhaes": "Luís Eduardo Magalhães",
      "l. e. magalhaes": "Luís Eduardo Magalhães",
      lem: "Luís Eduardo Magalhães",
    },
  },
  {
    productSlug: "milho",
    stateCode: "sc",
    regionMap: {
      chapeco: "Chapecó",
      xanxere: "Xanxerê",
    },
  },
  {
    productSlug: "milho",
    stateCode: "to",
    regionMap: {
      palmas: "Palmas",
      gurupi: "Gurupi",
      "pedro afonso": "Pedro Afonso",
    },
  },
  {
    productSlug: "milho",
    stateCode: "ma",
    regionMap: { balsas: "Balsas" },
  },
  {
    productSlug: "milho",
    stateCode: "pa",
    regionMap: {
      santarem: "Santarém",
      paragominas: "Paragominas",
    },
  },
  {
    productSlug: "milho",
    stateCode: "BR",
    urlPath: "milho/milho-mercado-fisico-sindicatos-e-cooperativas",
    autoParseCity: true,
    regionMap: {},
  },
  // ── Feijão (páginas nacionais por tipo — regiões mapeadas a cidades) ──
  {
    productSlug: "feijao",
    stateCode: "BR",
    urlPath: "feijao/feijao-carioca-nota-8",
    regionMap: {
      empacotadores: { city: "São Paulo", state: "SP" },
      sudoeste: { city: "Cascavel", state: "PR" },
      "triangulo mineiro": { city: "Uberlândia", state: "MG" },
      noroeste: { city: "Maringá", state: "PR" },
      leste: { city: "Ponta Grossa", state: "PR" },
      sul: { city: "Chapecó", state: "SC" },
      "centro oriental": { city: "Londrina", state: "PR" },
      "br 163": { city: "Dourados", state: "MS" },
    },
  },
  {
    productSlug: "feijao",
    stateCode: "BR",
    urlPath: "feijao/feijao-preto",
    regionMap: {
      empacotadores: { city: "São Paulo", state: "SP" },
      sudoeste: { city: "Cascavel", state: "PR" },
      "triangulo mineiro": { city: "Uberlândia", state: "MG" },
      noroeste: { city: "Maringá", state: "PR" },
      leste: { city: "Ponta Grossa", state: "PR" },
      sul: { city: "Chapecó", state: "SC" },
      "centro oriental": { city: "Londrina", state: "PR" },
      "br 163": { city: "Dourados", state: "MS" },
    },
  },
  {
    productSlug: "feijao",
    stateCode: "BR",
    urlPath: "feijao/feijao-carioca-nota-9-9-5",
    regionMap: {
      empacotadores: { city: "São Paulo", state: "SP" },
      sudoeste: { city: "Cascavel", state: "PR" },
      "triangulo mineiro": { city: "Uberlândia", state: "MG" },
      noroeste: { city: "Maringá", state: "PR" },
      leste: { city: "Ponta Grossa", state: "PR" },
      sul: { city: "Chapecó", state: "SC" },
      "centro oriental": { city: "Londrina", state: "PR" },
      "br 163": { city: "Dourados", state: "MS" },
    },
  },
];

async function scrapeNoticiasAgricolas(): Promise<RawQuote[]> {
  const results: RawQuote[] = [];

  for (const page of NA_PAGES) {
    const url = page.urlPath
      ? `https://www.noticiasagricolas.com.br/cotacoes/${page.urlPath}`
      : `https://www.noticiasagricolas.com.br/cotacoes/${page.productSlug}/${page.productSlug}-mercado-fisico-${page.stateCode}`;

    let html: string;
    try {
      html = await fetchHtml(url);
    } catch {
      continue;
    }

    const $ = cheerio.load(html);
    const firstTable = $("table.cot-fisicas").first();
    if (!firstTable.length) continue;

    // Extrai a data da tabela (busca em caption, th e td), com fallback na página
    const tableDate = extractTableDate($, firstTable) ?? extractPageDate($);

    firstTable.find("tbody tr").each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;
      const cellText = $(cells.eq(0)).text().trim();

      let canonicalCity: string;
      let stateCode: string;

      if (page.autoParseCity) {
        // Páginas de sindicatos/cooperativas: formato "Cidade/UF (fonte)"
        const cityStateMatch = cellText.match(/^(.+?)\/([A-Z]{2})\b/);
        if (!cityStateMatch) return;
        canonicalCity = cityStateMatch[1].trim();
        stateCode = cityStateMatch[2];
        // Ignora entradas de porto (preços portuários)
        if (/^porto\b/i.test(canonicalCity)) return;
      } else {
        const mapped = lookupInMap(page.regionMap, cellText);
        if (!mapped) return;

        if (typeof mapped === "string") {
          canonicalCity = mapped;
          stateCode = page.stateCode.toUpperCase();
        } else {
          canonicalCity = mapped.city;
          stateCode = mapped.state;
        }
      }

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
      const rowDate =
        parseBrazilianDate($(tr).text()) ??
        parseBrazilianTextDate($(tr).text()) ??
        tableDate;

      results.push({
        productSlug: page.productSlug,
        city: canonicalCity,
        state: stateCode,
        price,
        variation,
        date: rowDate,
      });
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

  // Mapa "STATEUP:normed-city" → city row
  const cityStateMap = new Map<string, (typeof allCities)[0]>();

  for (const c of allCities) {
    cityStateMap.set(`${c.stateCode}:${norm(c.name)}`, c);
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
    let cityRow = cityStateMap.get(`${stateUp}:${norm(row.city)}`);

    if (!cityRow) {
      // Auto-cria cidade se o estado existir no banco
      const [stateRow] = await db
        .select({ id: states.id })
        .from(states)
        .where(eq(states.code, stateUp))
        .limit(1);
      if (!stateRow) continue;

      const slug = norm(row.city).replace(/\s+/g, "-");
      await db
        .insert(cities)
        .values({ stateId: stateRow.id, name: row.city, slug })
        .onConflictDoNothing();
      const [created] = await db
        .select({ id: cities.id, name: cities.name, stateCode: states.code })
        .from(cities)
        .innerJoin(states, eq(cities.stateId, states.id))
        .where(eq(cities.slug, slug))
        .limit(1);
      if (!created) continue;
      cityRow = created;
      cityStateMap.set(`${stateUp}:${norm(row.city)}`, cityRow);
    }

    // Dedup: uma cotação por (produto, cidade, data) — fonte de maior prioridade vence
    const [existing] = await db
      .select({ id: quotes.id, sourceId: quotes.sourceId, price: quotes.price })
      .from(quotes)
      .where(
        and(
          eq(quotes.productId, product.id),
          eq(quotes.cityId, cityRow.id),
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
      } else {
        // Conflict: different source, same product/city/date
        const keepNew = row.price > existing.price;
        const keptSourceId = keepNew ? sourceId : existing.sourceId;
        const keptPrice = keepNew ? row.price : existing.price;
        const rejectedSourceId = keepNew ? existing.sourceId : sourceId;
        const rejectedPrice = keepNew ? existing.price : row.price;

        if (keepNew) {
          await db
            .update(quotes)
            .set({
              price: row.price,
              variation: row.variation ?? null,
              sourceId,
            })
            .where(eq(quotes.id, existing.id));
        }

        // Check if conflict already logged
        const [existingConflict] = await db
          .select({ id: quoteConflicts.id })
          .from(quoteConflicts)
          .where(
            and(
              eq(quoteConflicts.productId, product.id),
              eq(quoteConflicts.cityId, cityRow.id),
              eq(quoteConflicts.quoteDate, dateStr),
            ),
          )
          .limit(1);

        if (!existingConflict) {
          await db.insert(quoteConflicts).values({
            quoteId: existing.id,
            productId: product.id,
            cityId: cityRow.id,
            quoteDate: dateStr,
            keptSourceId,
            keptPrice,
            rejectedSourceId,
            rejectedPrice,
            status: "pending",
          });
        }
      }
      continue;
    }

    await db.insert(quotes).values({
      productId: product.id,
      cityId: cityRow.id,
      sourceId,
      price: row.price,
      variation: row.variation,
      quoteDate: dateStr,
    });
    inserted++;
  }

  return inserted;
}

// ── Scraping de Notícias ──────────────────────────────────────────────────────

import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { tags, newsArticleTags } from "./schema";

interface RawNews {
  title: string;
  slug: string;
  excerpt: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName: string;
  category: string;
  publishedAt: string; // YYYY-MM-DD
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function inferNewsCategory(title: string, fallback: string): string {
  const t = norm(title);
  if (/(boi|vaca|arroba|bovino|pecuaria|suino|frango|leite|nelore)/i.test(t))
    return "pecuaria";
  if (/(soja|milho|feijao|graos|trigo|arroz|safra|plantio|colheita)/i.test(t))
    return "graos";
  if (/(chuva|seca|clima|geada|previsao|tempo|el nino|la nina)/i.test(t))
    return "clima";
  return fallback;
}

/** Fetch full article content, og:image, and tags from the article page */
async function fetchArticleDetails(articleUrl: string): Promise<{
  content: string | undefined;
  ogImage: string | undefined;
  tags: string[];
  excerpt: string | undefined;
}> {
  try {
    const html = await fetchHtml(articleUrl);
    const $ = cheerio.load(html);

    const ogImage =
      $('meta[property="og:image"]').attr("content") ??
      $('meta[name="og:image"]').attr("content") ??
      undefined;

    let content: string | undefined;
    let excerpt: string | undefined;
    const articleEl =
      $("div.materia").first().html() ??
      $(".corpo-materia").first().html() ??
      $(".content-article").first().html() ??
      $("article .entry-content").first().html() ??
      $("article").first().html();
    if (articleEl) {
      const $content = cheerio.load(articleEl);
      $content(
        "script, style, iframe, .ad, .ads, .publicidade, .banner, .grupo-whatsapp",
      ).remove();
      content = $content.html() ?? undefined;

      const firstP = $content("p")
        .filter((_, el) => {
          const text = $content(el).text().trim();
          return text.length > 40;
        })
        .first()
        .text()
        .trim();
      if (firstP) {
        excerpt = firstP.slice(0, 300);
      }
    }

    if (!excerpt) {
      const ogDesc =
        $('meta[property="og:description"]').attr("content") ??
        $('meta[name="description"]').attr("content");
      if (ogDesc && ogDesc.length > 20) {
        excerpt = ogDesc.slice(0, 300);
      }
    }

    const extractedTags: string[] = [];
    $(".tags a, .tag-list a, .hashtags a, [rel='tag']").each((_, el) => {
      const tag = $(el).text().trim().replace(/^#/, "");
      if (tag && tag.length > 1 && tag.length < 50) {
        extractedTags.push(tag);
      }
    });

    const keywords =
      $('meta[name="keywords"]').attr("content") ??
      $('meta[name="news_keywords"]').attr("content");
    if (keywords) {
      for (const kw of keywords.split(",")) {
        const tag = kw.trim();
        if (tag && tag.length > 1 && tag.length < 50) {
          extractedTags.push(tag);
        }
      }
    }

    return { content, ogImage, tags: [...new Set(extractedTags)], excerpt };
  } catch {
    return {
      content: undefined,
      ogImage: undefined,
      tags: [],
      excerpt: undefined,
    };
  }
}

/** Auto-generate tags from title when none are extracted */
function autoTagsFromTitle(title: string): string[] {
  const t = norm(title);
  const generatedTags: string[] = [];

  const tagMap: Record<string, string> = {
    soja: "Soja",
    milho: "Milho",
    "boi gordo": "Boi Gordo",
    boi: "Boi Gordo",
    vaca: "Vaca Gorda",
    bovino: "Pecuária",
    pecuaria: "Pecuária",
    feijao: "Feijão",
    trigo: "Trigo",
    arroz: "Arroz",
    cafe: "Café",
    algodao: "Algodão",
    safra: "Safra",
    colheita: "Colheita",
    plantio: "Plantio",
    exportacao: "Exportação",
    importacao: "Importação",
    clima: "Clima",
    chuva: "Clima",
    seca: "Clima",
    geada: "Clima",
    "el nino": "El Niño",
    "la nina": "La Niña",
    chicago: "Bolsa de Chicago",
    cbot: "Bolsa de Chicago",
    cme: "CME Group",
    mercado: "Mercado",
    preco: "Preço",
    cotacao: "Cotação",
    agronegocio: "Agronegócio",
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (t.includes(keyword) && !generatedTags.includes(tag)) {
      generatedTags.push(tag);
    }
  }

  return generatedTags;
}

async function downloadImage(
  imageUrl: string,
  publishedAt: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    let ext = ".jpg";
    if (contentType.includes("png")) ext = ".png";
    else if (contentType.includes("webp")) ext = ".webp";
    else if (contentType.includes("gif")) ext = ".gif";
    else {
      const urlExt = extname(new URL(imageUrl).pathname).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(urlExt)) {
        ext = urlExt === ".jpeg" ? ".jpg" : urlExt;
      }
    }

    const [year, month] = publishedAt.split("-");
    const uuid = randomUUID();
    const dir = join(process.cwd(), "public", "images", "posts", year, month);
    await mkdir(dir, { recursive: true });

    const fileName = `${uuid}${ext}`;
    const filePath = join(dir, fileName);
    const buffer = Buffer.from(await res.arrayBuffer());

    // Resize to max 1080p if larger
    const image = sharp(buffer);
    const metadata = await image.metadata();
    if (
      (metadata.width && metadata.width > 1920) ||
      (metadata.height && metadata.height > 1080)
    ) {
      const resized = await image
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
      await writeFile(filePath, resized);
    } else {
      await writeFile(filePath, buffer);
    }

    return `/images/posts/${year}/${month}/${fileName}`;
  } catch (err) {
    console.error(
      "[news] Erro ao baixar imagem:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function scrapeNewsNoticiasAgricolas(
  activeNS: { url: string; category: string }[],
): Promise<RawNews[]> {
  const results: RawNews[] = [];
  const seenUrls = new Set<string>();

  for (const src of activeNS) {
    let html: string;
    try {
      html = await fetchHtml(src.url);
    } catch {
      continue;
    }

    const $ = cheerio.load(html);
    let currentDate = today();

    $("h3, li.horizontal").each((_, el) => {
      const tag = $(el).prop("tagName")?.toLowerCase();

      if (tag === "h3") {
        const parsed = parseBrazilianDate($(el).text());
        if (parsed) currentDate = parsed;
        return;
      }

      const anchor = $(el).find("a").first();
      const href = anchor.attr("href") ?? "";
      const title = anchor.find("h2").first().text().trim();
      if (!title || !href) return;

      const sourceUrl = href.startsWith("http")
        ? href
        : `https://www.noticiasagricolas.com.br${href}`;

      if (seenUrls.has(sourceUrl)) return;
      seenUrls.add(sourceUrl);

      const slug = `${slugify(title)}-${currentDate.replace(/-/g, "")}`;
      const category = inferNewsCategory(title, src.category);

      results.push({
        title,
        slug,
        excerpt: title,
        sourceUrl,
        sourceName: "Notícias Agrícolas",
        category,
        publishedAt: currentDate,
      });
    });
  }

  return results;
}

async function persistNews(items: RawNews[]): Promise<number> {
  let inserted = 0;
  for (const item of items) {
    const existing = await db
      .select({ id: newsArticles.id })
      .from(newsArticles)
      .where(eq(newsArticles.sourceUrl, item.sourceUrl))
      .limit(1);
    if (existing.length > 0) continue;

    try {
      // Fetch full content, og:image, and tags from actual article page
      const details = await fetchArticleDetails(item.sourceUrl);

      const [row] = await db
        .insert(newsArticles)
        .values({
          title: item.title,
          slug: item.slug,
          excerpt: details.excerpt ?? item.excerpt,
          content: details.content ?? null,
          imageUrl: item.imageUrl ?? null,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          category: item.category,
          publishedAt: item.publishedAt,
        })
        .onConflictDoNothing()
        .returning({ id: newsArticles.id });

      if (row) {
        // Download og:image
        if (details.ogImage) {
          const localPath = await downloadImage(
            details.ogImage,
            item.publishedAt,
          );
          if (localPath) {
            await db
              .update(newsArticles)
              .set({ imageUrl: localPath })
              .where(eq(newsArticles.id, row.id));
          }
        }

        // Persist tags
        const allTags =
          details.tags.length > 0
            ? details.tags
            : autoTagsFromTitle(item.title);

        for (const tagName of allTags) {
          const tagSlug = tagName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 50);

          await db
            .insert(tags)
            .values({ name: tagName, slug: tagSlug })
            .onConflictDoNothing();

          const [tagRow] = await db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.slug, tagSlug))
            .limit(1);

          if (tagRow) {
            await db
              .insert(newsArticleTags)
              .values({ articleId: row.id, tagId: tagRow.id })
              .onConflictDoNothing();
          }
        }

        inserted++;
      }
    } catch {
      // slug or sourceUrl conflict — already in DB
    }
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

  // Scraping de notícias agropecuárias
  try {
    console.log("[news] Iniciando scraping de notícias…");
    const activeNS = await db
      .select({ url: newsSources.url, category: newsSources.category })
      .from(newsSources)
      .where(eq(newsSources.active, 1));
    if (activeNS.length === 0) {
      console.log("[news] Nenhuma fonte de notícias ativa.");
    } else {
      const newsItems = await scrapeNewsNoticiasAgricolas(activeNS);
      const newsInserted = await persistNews(newsItems);
      console.log(`[news] ${newsInserted} notícias processadas.`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[news] Erro: ${message}`);
  }
}

main();
