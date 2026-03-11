import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { products, regions, sources, quotes } from "./schema";

const db = drizzle(process.env.DB_FILE_NAME!);

const PRODUCTS = [
  {
    slug: "boi-gordo",
    name: "Boi Gordo",
    category: "pecuaria",
    unit: "R$/arroba (@)",
  },
  {
    slug: "vaca-gorda",
    name: "Vaca Gorda",
    category: "pecuaria",
    unit: "R$/arroba (@)",
  },
  { slug: "soja", name: "Soja", category: "graos", unit: "R$/saca 60kg" },
  { slug: "milho", name: "Milho", category: "graos", unit: "R$/saca 60kg" },
  { slug: "feijao", name: "Feijão", category: "graos", unit: "R$/saca 60kg" },
];

const REGIONS = [
  {
    slug: "ms-campo-grande",
    name: "Campo Grande",
    state: "MS",
    city: "Campo Grande",
  },
  { slug: "ms-dourados", name: "Dourados", state: "MS", city: "Dourados" },
  { slug: "mt-cuiaba", name: "Cuiabá", state: "MT", city: "Cuiabá" },
  {
    slug: "mt-rondonopolis",
    name: "Rondonópolis",
    state: "MT",
    city: "Rondonópolis",
  },
  { slug: "pr-curitiba", name: "Curitiba", state: "PR", city: "Curitiba" },
  { slug: "pr-maringa", name: "Maringá", state: "PR", city: "Maringá" },
  { slug: "sp-sao-paulo", name: "São Paulo", state: "SP", city: "São Paulo" },
  {
    slug: "sp-ribeirao-preto",
    name: "Ribeirão Preto",
    state: "SP",
    city: "Ribeirão Preto",
  },
  { slug: "go-goiania", name: "Goiânia", state: "GO", city: "Goiânia" },
  {
    slug: "mg-uberlandia",
    name: "Uberlândia",
    state: "MG",
    city: "Uberlândia",
  },
];

const SOURCES = [
  {
    slug: "scotconsultoria",
    name: "Scot Consultoria",
    url: "https://www.scotconsultoria.com.br/cotacoes/?ref=mnp",
    priority: 1,
  },
  {
    slug: "noticiasagricolas",
    name: "Notícias Agrícolas",
    url: "https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms",
    priority: 2,
  },
  {
    slug: "agrolink",
    name: "Agrolink",
    url: "https://www.agrolink.com.br/cotacoes/graos/soja",
    priority: 3,
  },
];

// Base prices per product (realistic Brazilian market values, march 2026)
const BASE_PRICES: Record<string, Record<string, number>> = {
  "boi-gordo": {
    "ms-campo-grande": 296,
    "ms-dourados": 294,
    "mt-cuiaba": 292,
    "mt-rondonopolis": 291,
    "pr-curitiba": 300,
    "pr-maringa": 298,
    "sp-sao-paulo": 303,
    "sp-ribeirao-preto": 301,
    "go-goiania": 295,
    "mg-uberlandia": 297,
  },
  "vaca-gorda": {
    "ms-campo-grande": 252,
    "ms-dourados": 250,
    "mt-cuiaba": 248,
    "mt-rondonopolis": 247,
    "pr-curitiba": 256,
    "pr-maringa": 254,
    "sp-sao-paulo": 258,
    "sp-ribeirao-preto": 256,
    "go-goiania": 251,
    "mg-uberlandia": 253,
  },
  soja: {
    "ms-campo-grande": 138,
    "ms-dourados": 137,
    "mt-cuiaba": 135,
    "mt-rondonopolis": 136,
    "pr-curitiba": 141,
    "pr-maringa": 140,
    "sp-sao-paulo": 142,
    "sp-ribeirao-preto": 141,
    "go-goiania": 137,
    "mg-uberlandia": 139,
  },
  milho: {
    "ms-campo-grande": 60,
    "ms-dourados": 59,
    "mt-cuiaba": 58,
    "mt-rondonopolis": 58,
    "pr-curitiba": 62,
    "pr-maringa": 61,
    "sp-sao-paulo": 63,
    "sp-ribeirao-preto": 62,
    "go-goiania": 60,
    "mg-uberlandia": 61,
  },
  feijao: {
    "ms-campo-grande": 220,
    "ms-dourados": 218,
    "mt-cuiaba": 215,
    "mt-rondonopolis": 216,
    "pr-curitiba": 225,
    "pr-maringa": 222,
    "sp-sao-paulo": 228,
    "sp-ribeirao-preto": 226,
    "go-goiania": 219,
    "mg-uberlandia": 221,
  },
};

function jitter(base: number, pct = 0.03): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

async function main() {
  console.log("Seeding products…");
  for (const p of PRODUCTS) {
    await db.insert(products).values(p).onConflictDoNothing();
  }

  console.log("Seeding regions…");
  for (const r of REGIONS) {
    await db.insert(regions).values(r).onConflictDoNothing();
  }

  console.log("Seeding sources…");
  for (const s of SOURCES) {
    await db.insert(sources).values(s).onConflictDoNothing();
  }

  // Fetch IDs
  const allProducts = await db.select().from(products);
  const allRegions = await db.select().from(regions);
  const allSources = await db.select().from(sources);

  const sourceId = allSources[0].id;

  console.log("Seeding 30 days of quotes…");
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const dateStr = date.toISOString().slice(0, 10);

    for (const product of allProducts) {
      for (const region of allRegions) {
        const base = BASE_PRICES[product.slug]?.[region.slug];
        if (!base) continue;
        const price = jitter(base);
        const variation = Math.round((Math.random() * 4 - 2) * 100) / 100;
        await db
          .insert(quotes)
          .values({
            productId: product.id,
            regionId: region.id,
            sourceId,
            price,
            variation,
            quoteDate: dateStr,
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log("✅ Seed concluído!");
}

main().catch(console.error);
