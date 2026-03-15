import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { hashPassword } from "../lib/password";
import { products, regions, sources, users } from "./schema";

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

  console.log("Seeding regions…");
  for (const r of REGIONS) {
    await db.insert(regions).values(r).onConflictDoNothing();
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
