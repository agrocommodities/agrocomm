import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import {
  products,
  states,
  cities,
  sources,
  users,
  newsSources,
} from "./schema";

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
  { code: "AL", name: "Alagoas" },
  { code: "AC", name: "Acre" },
  { code: "ES", name: "Espírito Santo" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RR", name: "Roraima" },
];

// Cities: [stateCode, cityName, slug]
const CITIES: [string, string, string][] = [
  // Mato Grosso do Sul
  ["MS", "Campo Grande", "ms-campo-grande"],
  ["MS", "Dourados", "ms-dourados"],
  ["MS", "Três Lagoas", "ms-tres-lagoas"],
  ["MS", "Maracaju", "ms-maracaju"],
  ["MS", "Rio Brilhante", "ms-rio-brilhante"],
  ["MS", "Sidrolândia", "ms-sidrolandia"],
  ["MS", "Chapadão do Sul", "ms-chapadao-do-sul"],
  ["MS", "São Gabriel do Oeste", "ms-sao-gabriel-do-oeste"],
  // Mato Grosso
  ["MT", "Cuiabá", "mt-cuiaba"],
  ["MT", "Rondonópolis", "mt-rondonopolis"],
  ["MT", "Sorriso", "mt-sorriso"],
  ["MT", "Sinop", "mt-sinop"],
  ["MT", "Lucas do Rio Verde", "mt-lucas-rio-verde"],
  ["MT", "Campo Verde", "mt-campo-verde"],
  ["MT", "Nova Mutum", "mt-nova-mutum"],
  ["MT", "Cáceres", "mt-caceres"],
  // Goiás
  ["GO", "Goiânia", "go-goiania"],
  ["GO", "Rio Verde", "go-rio-verde"],
  ["GO", "Jataí", "go-jatai"],
  // Minas Gerais
  ["MG", "Uberlândia", "mg-uberlandia"],
  ["MG", "Uberaba", "mg-uberaba"],
  ["MG", "Patos de Minas", "mg-patos-de-minas"],
  ["MG", "Sete Lagoas", "mg-sete-lagoas"],
  ["MG", "Belo Horizonte", "mg-belo-horizonte"],
  ["MG", "Montes Claros", "mg-montes-claros"],
  ["MG", "Varginha", "mg-varginha"],
  // São Paulo
  ["SP", "São Paulo", "sp-sao-paulo"],
  ["SP", "Ribeirão Preto", "sp-ribeirao-preto"],
  ["SP", "Barretos", "sp-barretos"],
  ["SP", "Araçatuba", "sp-aracatuba"],
  ["SP", "Presidente Prudente", "sp-presidente-prudente"],
  ["SP", "São José do Rio Preto", "sp-sao-jose-rio-preto"],
  ["SP", "Campinas", "sp-campinas"],
  // Paraná
  ["PR", "Curitiba", "pr-curitiba"],
  ["PR", "Maringá", "pr-maringa"],
  ["PR", "Cascavel", "pr-cascavel"],
  ["PR", "Londrina", "pr-londrina"],
  ["PR", "Ponta Grossa", "pr-ponta-grossa"],
  ["PR", "Paranaguá", "pr-paranagua"],
  // Rio Grande do Sul
  ["RS", "Porto Alegre", "rs-porto-alegre"],
  ["RS", "Passo Fundo", "rs-passo-fundo"],
  ["RS", "Cruz Alta", "rs-cruz-alta"],
  ["RS", "Santa Rosa", "rs-santa-rosa"],
  ["RS", "Ijuí", "rs-ijui"],
  ["RS", "Pelotas", "rs-pelotas"],
  // Santa Catarina
  ["SC", "Chapecó", "sc-chapeco"],
  ["SC", "Xanxerê", "sc-xanxere"],
  ["SC", "Lages", "sc-lages"],
  // Tocantins
  ["TO", "Araguaína", "to-araguaina"],
  ["TO", "Palmas", "to-palmas"],
  ["TO", "Gurupi", "to-gurupi"],
  ["TO", "Pedro Afonso", "to-pedro-afonso"],
  // Pará
  ["PA", "Santarém", "pa-santarem"],
  ["PA", "Paragominas", "pa-paragominas"],
  ["PA", "Marabá", "pa-maraba"],
  ["PA", "Redenção", "pa-redencao"],
  ["PA", "Belém", "pa-belem"],
  // Bahia
  ["BA", "Barreiras", "ba-barreiras"],
  ["BA", "Luís Eduardo Magalhães", "ba-luiz-eduardo"],
  ["BA", "Itapetinga", "ba-itapetinga"],
  // Maranhão
  ["MA", "Balsas", "ma-balsas"],
  // Rondônia
  ["RO", "Vilhena", "ro-vilhena"],
  ["RO", "Ji-Paraná", "ro-ji-parana"],
  // Alagoas
  ["AL", "Maceió", "al-maceio"],
  // Acre
  ["AC", "Rio Branco", "ac-rio-branco"],
  // Espírito Santo
  ["ES", "Vitória", "es-vitoria"],
  // Rio de Janeiro
  ["RJ", "Rio de Janeiro", "rj-rio-de-janeiro"],
  // Roraima
  ["RR", "Boa Vista", "rr-boa-vista"],
];

const SOURCES = [
  {
    slug: "scotconsultoria",
    name: "Scot Consultoria",
    url: "https://www.scotconsultoria.com.br/cotacoes/",
    priority: 1,
    active: 1,
  },
  {
    slug: "noticiasagricolas",
    name: "Notícias Agrícolas",
    url: "https://www.noticiasagricolas.com.br/cotacoes/",
    priority: 2,
    active: 1,
  },
  {
    slug: "agrolink",
    name: "Agrolink",
    url: "https://www.agrolink.com.br/cotacoes/",
    priority: 3,
    active: 0, // exibe preços via sprites CSS — não é scrapeable com HTML parser
  },
];

const NEWS_SOURCES = [
  {
    slug: "na-boi",
    name: "NA — Boi",
    url: "https://www.noticiasagricolas.com.br/noticias/boi/",
    category: "pecuaria",
    active: 1,
  },
  {
    slug: "na-soja",
    name: "NA — Soja",
    url: "https://www.noticiasagricolas.com.br/noticias/soja/",
    category: "graos",
    active: 1,
  },
  {
    slug: "na-milho",
    name: "NA — Milho",
    url: "https://www.noticiasagricolas.com.br/noticias/milho/",
    category: "graos",
    active: 1,
  },
  {
    slug: "na-clima",
    name: "NA — Clima",
    url: "https://www.noticiasagricolas.com.br/noticias/clima/",
    category: "clima",
    active: 1,
  },
  {
    slug: "na-cafe",
    name: "NA — Café",
    url: "https://www.noticiasagricolas.com.br/noticias/cafe/",
    category: "geral",
    active: 1,
  },
  {
    slug: "na-algodao",
    name: "NA — Algodão",
    url: "https://www.noticiasagricolas.com.br/noticias/algodao/",
    category: "geral",
    active: 1,
  },
  {
    slug: "na-graos",
    name: "NA — Grãos",
    url: "https://www.noticiasagricolas.com.br/noticias/graos/",
    category: "graos",
    active: 1,
  },
  {
    slug: "na-feijao",
    name: "NA — Feijão",
    url: "https://www.noticiasagricolas.com.br/noticias/feijao-e-graos-especiais/",
    category: "graos",
    active: 0,
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
      .onConflictDoUpdate({
        target: sources.slug,
        set: { active: s.active, url: s.url },
      });
  }

  console.log("Seeding news sources…");
  for (const ns of NEWS_SOURCES) {
    await db
      .insert(newsSources)
      .values(ns)
      .onConflictDoUpdate({
        target: newsSources.slug,
        set: { active: ns.active, url: ns.url, category: ns.category },
      });
  }

  console.log("✅ Seed concluído!");
}

main().catch(console.error);
