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
  classifiedCategories,
  moderationSettings,
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
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AM", name: "Amazonas" },
  { code: "AP", name: "Amapá" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MG", name: "Minas Gerais" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MT", name: "Mato Grosso" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "PR", name: "Paraná" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SE", name: "Sergipe" },
  { code: "SP", name: "São Paulo" },
  { code: "TO", name: "Tocantins" },
];

// Cities: [stateCode, cityName, slug]
const CITIES: [string, string, string][] = [
  // Acre
  ["AC", "Rio Branco", "rio-branco"],
  ["AC", "Cruzeiro do Sul", "cruzeiro-do-sul"],
  ["AC", "Sena Madureira", "sena-madureira"],
  ["AC", "Tarauacá", "tarauaca"],
  // Alagoas
  ["AL", "Maceió", "maceio"],
  ["AL", "Arapiraca", "arapiraca"],
  ["AL", "Palmeira dos Índios", "palmeira-dos-indios"],
  ["AL", "Rio Largo", "rio-largo"],
  // Amazonas
  ["AM", "Manaus", "manaus"],
  ["AM", "Parintins", "parintins"],
  ["AM", "Itacoatiara", "itacoatiara"],
  ["AM", "Manacapuru", "manacapuru"],
  ["AM", "Tefé", "tefe"],
  // Amapá
  ["AP", "Macapá", "macapa"],
  ["AP", "Santana", "santana-ap"],
  ["AP", "Laranjal do Jari", "laranjal-do-jari"],
  // Bahia
  ["BA", "Salvador", "salvador"],
  ["BA", "Feira de Santana", "feira-de-santana"],
  ["BA", "Vitória da Conquista", "vitoria-da-conquista"],
  ["BA", "Barreiras", "barreiras"],
  ["BA", "Luís Eduardo Magalhães", "luis-eduardo-magalhaes"],
  ["BA", "Itapetinga", "itapetinga"],
  ["BA", "Ilhéus", "ilheus"],
  ["BA", "Juazeiro", "juazeiro-ba"],
  // Ceará
  ["CE", "Fortaleza", "fortaleza"],
  ["CE", "Juazeiro do Norte", "juazeiro-do-norte"],
  ["CE", "Sobral", "sobral"],
  ["CE", "Maracanaú", "maracanau"],
  ["CE", "Crato", "crato"],
  ["CE", "Quixadá", "quixada"],
  // Distrito Federal
  ["DF", "Brasília", "brasilia"],
  // Espírito Santo
  ["ES", "Vitória", "vitoria"],
  ["ES", "Vila Velha", "vila-velha"],
  ["ES", "Serra", "serra-es"],
  ["ES", "Linhares", "linhares"],
  ["ES", "Colatina", "colatina"],
  // Goiás
  ["GO", "Goiânia", "goiania"],
  ["GO", "Aparecida de Goiânia", "aparecida-de-goiania"],
  ["GO", "Anápolis", "anapolis"],
  ["GO", "Rio Verde", "rio-verde"],
  ["GO", "Jataí", "jatai"],
  ["GO", "Catalão", "catalao"],
  // Maranhão
  ["MA", "São Luís", "sao-luis"],
  ["MA", "Imperatriz", "imperatriz"],
  ["MA", "Balsas", "balsas"],
  ["MA", "Açailândia", "acailandia"],
  ["MA", "Timon", "timon"],
  // Minas Gerais
  ["MG", "Belo Horizonte", "belo-horizonte"],
  ["MG", "Uberlândia", "uberlandia"],
  ["MG", "Uberaba", "uberaba"],
  ["MG", "Patos de Minas", "patos-de-minas"],
  ["MG", "Sete Lagoas", "sete-lagoas"],
  ["MG", "Montes Claros", "montes-claros"],
  ["MG", "Varginha", "varginha"],
  ["MG", "Juiz de Fora", "juiz-de-fora"],
  ["MG", "Governador Valadares", "governador-valadares"],
  ["MG", "Lavras", "lavras"],
  // Mato Grosso do Sul
  ["MS", "Campo Grande", "campo-grande"],
  ["MS", "Dourados", "dourados"],
  ["MS", "Três Lagoas", "tres-lagoas"],
  ["MS", "Maracaju", "maracaju"],
  ["MS", "Rio Brilhante", "rio-brilhante"],
  ["MS", "Sidrolândia", "sidrolandia"],
  ["MS", "Chapadão do Sul", "chapadao-do-sul"],
  ["MS", "São Gabriel do Oeste", "sao-gabriel-do-oeste"],
  ["MS", "Naviraí", "navirai"],
  ["MS", "Ponta Porã", "ponta-pora"],
  // Mato Grosso
  ["MT", "Cuiabá", "cuiaba"],
  ["MT", "Rondonópolis", "rondonopolis"],
  ["MT", "Sorriso", "sorriso"],
  ["MT", "Sinop", "sinop"],
  ["MT", "Lucas do Rio Verde", "lucas-do-rio-verde"],
  ["MT", "Campo Verde", "campo-verde"],
  ["MT", "Nova Mutum", "nova-mutum"],
  ["MT", "Cáceres", "caceres"],
  ["MT", "Primavera do Leste", "primavera-do-leste"],
  ["MT", "Tangará da Serra", "tangara-da-serra"],
  // Pará
  ["PA", "Belém", "belem"],
  ["PA", "Ananindeua", "ananindeua"],
  ["PA", "Santarém", "santarem"],
  ["PA", "Marabá", "maraba"],
  ["PA", "Paragominas", "paragominas"],
  ["PA", "Redenção", "redencao"],
  ["PA", "Altamira", "altamira"],
  ["PA", "Castanhal", "castanhal"],
  // Paraíba
  ["PB", "João Pessoa", "joao-pessoa"],
  ["PB", "Campina Grande", "campina-grande"],
  ["PB", "Patos", "patos-pb"],
  ["PB", "Sousa", "sousa"],
  ["PB", "Cajazeiras", "cajazeiras"],
  // Pernambuco
  ["PE", "Recife", "recife"],
  ["PE", "Caruaru", "caruaru"],
  ["PE", "Petrolina", "petrolina"],
  ["PE", "Garanhuns", "garanhuns"],
  ["PE", "Vitória de Santo Antão", "vitoria-de-santo-antao"],
  ["PE", "Serra Talhada", "serra-talhada"],
  // Piauí
  ["PI", "Teresina", "teresina"],
  ["PI", "Parnaíba", "parnaiba"],
  ["PI", "Uruçuí", "urucui"],
  ["PI", "Bom Jesus", "bom-jesus-pi"],
  ["PI", "Floriano", "floriano"],
  ["PI", "Picos", "picos"],
  // Paraná
  ["PR", "Curitiba", "curitiba"],
  ["PR", "Maringá", "maringa"],
  ["PR", "Cascavel", "cascavel"],
  ["PR", "Londrina", "londrina"],
  ["PR", "Ponta Grossa", "ponta-grossa"],
  ["PR", "Paranaguá", "paranagua"],
  ["PR", "Toledo", "toledo"],
  ["PR", "Guarapuava", "guarapuava"],
  // Rio de Janeiro
  ["RJ", "Rio de Janeiro", "rio-de-janeiro"],
  ["RJ", "Campos dos Goytacazes", "campos-dos-goytacazes"],
  ["RJ", "Nova Iguaçu", "nova-iguacu"],
  ["RJ", "Niterói", "niteroi"],
  ["RJ", "Petrópolis", "petropolis"],
  // Rio Grande do Norte
  ["RN", "Natal", "natal"],
  ["RN", "Mossoró", "mossoro"],
  ["RN", "Parnamirim", "parnamirim"],
  ["RN", "Caicó", "caico"],
  ["RN", "Açu", "acu"],
  // Rondônia
  ["RO", "Porto Velho", "porto-velho"],
  ["RO", "Ji-Paraná", "ji-parana"],
  ["RO", "Vilhena", "vilhena"],
  ["RO", "Cacoal", "cacoal"],
  ["RO", "Ariquemes", "ariquemes"],
  // Roraima
  ["RR", "Boa Vista", "boa-vista"],
  ["RR", "Rorainópolis", "rorainopolis"],
  // Rio Grande do Sul
  ["RS", "Porto Alegre", "porto-alegre"],
  ["RS", "Passo Fundo", "passo-fundo"],
  ["RS", "Cruz Alta", "cruz-alta"],
  ["RS", "Santa Rosa", "santa-rosa"],
  ["RS", "Ijuí", "ijui"],
  ["RS", "Pelotas", "pelotas"],
  ["RS", "Caxias do Sul", "caxias-do-sul"],
  ["RS", "Santa Maria", "santa-maria"],
  ["RS", "Rio Grande", "rio-grande-rs"],
  // Santa Catarina
  ["SC", "Florianópolis", "florianopolis"],
  ["SC", "Chapecó", "chapeco"],
  ["SC", "Xanxerê", "xanxere"],
  ["SC", "Lages", "lages"],
  ["SC", "Joinville", "joinville"],
  ["SC", "Blumenau", "blumenau"],
  // Sergipe
  ["SE", "Aracaju", "aracaju"],
  ["SE", "Lagarto", "lagarto"],
  ["SE", "Itabaiana", "itabaiana-se"],
  ["SE", "Nossa Senhora do Socorro", "nossa-senhora-do-socorro"],
  // São Paulo
  ["SP", "São Paulo", "sao-paulo"],
  ["SP", "Ribeirão Preto", "ribeirao-preto"],
  ["SP", "Barretos", "barretos"],
  ["SP", "Araçatuba", "aracatuba"],
  ["SP", "Presidente Prudente", "presidente-prudente"],
  ["SP", "São José do Rio Preto", "sao-jose-do-rio-preto"],
  ["SP", "Campinas", "campinas"],
  ["SP", "Sorocaba", "sorocaba"],
  ["SP", "Piracicaba", "piracicaba"],
  ["SP", "Marília", "marilia"],
  // Tocantins
  ["TO", "Palmas", "palmas"],
  ["TO", "Araguaína", "araguaina"],
  ["TO", "Gurupi", "gurupi"],
  ["TO", "Pedro Afonso", "pedro-afonso"],
  ["TO", "Porto Nacional", "porto-nacional"],
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

  console.log("Seeding classified categories…");
  const CLASSIFIED_CATEGORIES = [
    { name: "Tratores", slug: "tratores", icon: "Tractor" },
    { name: "Colheitadeiras", slug: "colheitadeiras", icon: "Combine" },
    {
      name: "Implementos Agrícolas",
      slug: "implementos-agricolas",
      icon: "Wrench",
    },
    { name: "Caminhões", slug: "caminhoes", icon: "Truck" },
    { name: "Máquinas", slug: "maquinas", icon: "Cog" },
    { name: "Gado", slug: "gado", icon: "Beef" },
    { name: "Cavalos", slug: "cavalos", icon: "Horse" },
    { name: "Fazendas e Sítios", slug: "fazendas-sitios", icon: "TreePine" },
    { name: "Sementes e Insumos", slug: "sementes-insumos", icon: "Wheat" },
    { name: "Irrigação", slug: "irrigacao", icon: "Droplets" },
    { name: "Drones e Tecnologia", slug: "drones-tecnologia", icon: "Radar" },
    { name: "Outros", slug: "outros", icon: "Package" },
  ];
  for (const c of CLASSIFIED_CATEGORIES) {
    await db.insert(classifiedCategories).values(c).onConflictDoNothing();
  }

  console.log("Seeding moderation settings…");
  const MOD_SETTINGS = [
    {
      key: "block_phones",
      enabled: 1,
      action: "censor",
      censorText: "[telefone removido]",
    },
    {
      key: "block_emails",
      enabled: 1,
      action: "censor",
      censorText: "[e-mail removido]",
    },
    {
      key: "block_addresses",
      enabled: 1,
      action: "censor",
      censorText: "[endereço removido]",
    },
    {
      key: "block_social",
      enabled: 1,
      action: "censor",
      censorText: "[rede social removida]",
    },
    {
      key: "block_links",
      enabled: 1,
      action: "censor",
      censorText: "[link removido]",
    },
  ];
  for (const s of MOD_SETTINGS) {
    await db.insert(moderationSettings).values(s).onConflictDoNothing();
  }

  console.log("✅ Seed concluído!");
}

main().catch(console.error);
