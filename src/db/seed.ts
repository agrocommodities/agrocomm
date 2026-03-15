import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { products, states, cities, sources, users } from "./schema";

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

const STATES = [
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MT", name: "Mato Grosso" },
  { code: "GO", name: "Goiás" },
  { code: "MG", name: "Minas Gerais" },
  { code: "SP", name: "São Paulo" },
  { code: "PR", name: "Paraná" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "SC", name: "Santa Catarina" },
  { code: "TO", name: "Tocantins" },
  { code: "PA", name: "Pará" },
  { code: "BA", name: "Bahia" },
  { code: "MA", name: "Maranhão" },
  { code: "RO", name: "Rondônia" },
];

// Cities: [stateCode, cityName, slug]
const CITIES: [string, string, string][] = [
  // Mato Grosso do Sul
  ["MS", "Campo Grande",  "ms-campo-grande"],
  ["MS", "Dourados",      "ms-dourados"],
  ["MS", "Três Lagoas",   "ms-tres-lagoas"],
  ["MS", "Maracaju",      "ms-maracaju"],
  ["MS", "Rio Brilhante", "ms-rio-brilhante"],
  // Mato Grosso
  ["MT", "Cuiabá",             "mt-cuiaba"],
  ["MT", "Rondonópolis",       "mt-rondonopolis"],
  ["MT", "Sorriso",            "mt-sorriso"],
  ["MT", "Sinop",              "mt-sinop"],
  ["MT", "Lucas do Rio Verde", "mt-lucas-rio-verde"],
  ["MT", "Campo Verde",        "mt-campo-verde"],
  ["MT", "Nova Mutum",         "mt-nova-mutum"],
  // Goiás
  ["GO", "Goiânia",   "go-goiania"],
  ["GO", "Rio Verde", "go-rio-verde"],
  ["GO", "Jataí",     "go-jatai"],
  // Minas Gerais
  ["MG", "Uberlândia",     "mg-uberlandia"],
  ["MG", "Uberaba",        "mg-uberaba"],
  ["MG", "Patos de Minas", "mg-patos-de-minas"],
  ["MG", "Sete Lagoas",    "mg-sete-lagoas"],
  // São Paulo
  ["SP", "São Paulo",             "sp-sao-paulo"],
  ["SP", "Ribeirão Preto",        "sp-ribeirao-preto"],
  ["SP", "Barretos",              "sp-barretos"],
  ["SP", "Araçatuba",             "sp-aracatuba"],
  ["SP", "Presidente Prudente",   "sp-presidente-prudente"],
  ["SP", "São José do Rio Preto", "sp-sao-jose-rio-preto"],
  ["SP", "Campinas",              "sp-campinas"],
  // Paraná
  ["PR", "Curitiba",     "pr-curitiba"],
  ["PR", "Maringá",      "pr-maringa"],
  ["PR", "Cascavel",     "pr-cascavel"],
  ["PR", "Londrina",     "pr-londrina"],
  ["PR", "Ponta Grossa", "pr-ponta-grossa"],
  ["PR", "Paranaguá",    "pr-paranagua"],
  // Rio Grande do Sul
  ["RS", "Porto Alegre", "rs-porto-alegre"],
  ["RS", "Passo Fundo",  "rs-passo-fundo"],
  ["RS", "Cruz Alta",    "rs-cruz-alta"],
  ["RS", "Santa Rosa",   "rs-santa-rosa"],
  ["RS", "Ijuí",         "rs-ijui"],
  // Santa Catarina
  ["SC", "Chapecó", "sc-chapeco"],
  ["SC", "Xanxerê", "sc-xanxere"],
  ["SC", "Lages",   "sc-lages"],
  // Tocantins
  ["TO", "Araguaína",    "to-araguaina"],
  ["TO", "Palmas",       "to-palmas"],
  ["TO", "Gurupi",       "to-gurupi"],
  ["TO", "Pedro Afonso", "to-pedro-afonso"],
  // Pará
  ["PA", "Santarém",    "pa-santarem"],
  ["PA", "Paragominas", "pa-paragominas"],
  ["PA", "Marabá",      "pa-maraba"],
  // Bahia
  ["BA", "Barreiras",              "ba-barreiras"],
  ["BA", "Luís Eduardo Magalhães", "ba-luiz-eduardo"],
  // Maranhão
  ["MA", "Balsas", "ma-balsas"],
  // Rondônia
  ["RO", "Vilhena",   "ro-vilhena"],
  ["RO", "Ji-Paraná", "ro-ji-parana"],
];

const SOURCES = [
  {
    slug: "scotconsultoria",
    name: "Scot Consultoria",
    url: "https://www.scotconsultoria.com.br/cotacoes/boi-gordo/",
    priority: 1,
    active: 1,
  },
  {
    slug: "noticiasagricolas",
    name: "Notícias Agrícolas",
    url: "https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms",
    priority: 2,
    active: 1,
  },
  {
    slug: "agrolink",
    name: "Agrolink",
    url: "https://www.agrolink.com.br/cotacoes/graos/soja",
    priority: 3,
    active: 0, // exibe preços via sprites CSS — não é scrapeable com HTML parser
  },
];

async function main() {
  console.log("Seeding admin user…");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no .env",
    );
  }
  const passwordHash = await hashPassword(adminPassword);
  await db
    .insert(users)
    .values({ name: "Admin", email: adminEmail, passwordHash, role: "admin" })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, role: "admin" },
    });

  console.log("Seeding products…");
  for (const p of PRODUCTS) {
    await db.insert(products).values(p).onConflictDoNothing();
  }

  console.log("Seeding states…");
  for (const s of STATES) {
    await db.insert(states).values(s).onConflictDoNothing();
  }

  console.log("Seeding cities…");
  for (const [stateCode, cityName, slug] of CITIES) {
    const [stateRow] = await db
      .select({ id: states.id })
      .from(states)
      .where(eq(states.code, stateCode))
      .limit(1);
    if (!stateRow) continue;
    await db
      .insert(cities)
      .values({ stateId: stateRow.id, name: cityName, slug })
      .onConflictDoNothing();
  }

  console.log("Seeding sources…");
  for (const s of SOURCES) {
    await db
      .insert(sources)
      .values(s)
      .onConflictDoUpdate({ target: sources.slug, set: { active: s.active } });
  }

  console.log("✅ Seed concluído!");
}

main().catch(console.error);
