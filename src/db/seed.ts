import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/libsql";
import { eq, sql } from "drizzle-orm";
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
  roles,
  permissions,
  rolePermissions,
} from "./schema";

const db = drizzle(process.env.DB_FILE_NAME!);

// ── Load states and cities from JSON ──────────────────────────────────────────

interface EstadoJSON {
  id: number;
  name: string;
  iso2: string;
}

interface CidadeJSON {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
}

const currentDir =
  import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const jsonDir = resolve(currentDir, "../../json");

const estadosJSON: EstadoJSON[] = JSON.parse(
  readFileSync(resolve(jsonDir, "estados.json"), "utf-8"),
);

const cidadesJSON: CidadeJSON[] = JSON.parse(
  readFileSync(resolve(jsonDir, "cidades.json"), "utf-8"),
);

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

const STATES = estadosJSON.map((e) => ({
  code: e.iso2,
  name: e.name,
}));

const CITIES = cidadesJSON.map((c) => ({
  stateCode: c.state_code,
  name: c.name,
  slug: slugify(c.name),
}));

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
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      emailVerified: 1,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, role: "admin", emailVerified: 1 },
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
  const stateIdByCode = new Map<string, number>();
  const allStates = await db
    .select({ id: states.id, code: states.code })
    .from(states);
  for (const s of allStates) {
    stateIdByCode.set(s.code, s.id);
  }
  for (const city of CITIES) {
    const stateId = stateIdByCode.get(city.stateCode);
    if (!stateId) continue;
    await db
      .insert(cities)
      .values({ stateId, name: city.name, slug: city.slug })
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
    { name: "Camionetes", slug: "camionetes", icon: "Truck" },
    { name: "Carros", slug: "carros", icon: "Car" },
    { name: "Motos", slug: "motos", icon: "Motorcycle" },
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

  // ── Permissions ─────────────────────────────────────────────────────────────

  console.log("Seeding permissions…");
  const PERMISSIONS = [
    {
      key: "admin.access",
      name: "Acessar painel admin",
      category: "admin",
    },
    {
      key: "admin.users",
      name: "Gerenciar usuários",
      category: "admin",
    },
    {
      key: "admin.roles",
      name: "Gerenciar cargos e permissões",
      category: "admin",
    },
    {
      key: "admin.quotes",
      name: "Gerenciar cotações",
      category: "admin",
    },
    {
      key: "admin.news",
      name: "Gerenciar notícias",
      category: "admin",
    },
    {
      key: "admin.classifieds",
      name: "Moderação de classificados",
      category: "admin",
    },
    {
      key: "admin.categories",
      name: "Gerenciar categorias",
      category: "admin",
    },
    {
      key: "admin.moderation",
      name: "Configurar moderação",
      category: "admin",
    },
    {
      key: "admin.scraping",
      name: "Gerenciar scraping",
      category: "admin",
    },
    {
      key: "admin.storage",
      name: "Gerenciar armazenamento",
      category: "admin",
    },
    {
      key: "admin.stats",
      name: "Ver estatísticas",
      category: "admin",
    },
    {
      key: "admin.logs",
      name: "Ver logs de auditoria",
      category: "admin",
    },
    {
      key: "admin.conflicts",
      name: "Gerenciar conflitos de cotações",
      category: "admin",
    },
    {
      key: "classifieds.create",
      name: "Criar classificados",
      category: "classificados",
    },
    {
      key: "classifieds.comment",
      name: "Comentar em classificados",
      category: "classificados",
    },
  ];

  for (const p of PERMISSIONS) {
    await db.insert(permissions).values(p).onConflictDoNothing();
  }

  // ── Roles ───────────────────────────────────────────────────────────────────

  console.log("Seeding roles…");
  const ROLES = [
    {
      name: "Super Admin",
      slug: "super-admin",
      description: "Acesso total ao sistema",
      isSystem: 1,
    },
    {
      name: "Corretor",
      slug: "corretor",
      description: "Corretor de commodities",
      isSystem: 0,
    },
    {
      name: "Cerealista",
      slug: "cerealista",
      description: "Comerciante de cereais e grãos",
      isSystem: 0,
    },
    {
      name: "Agricultor",
      slug: "agricultor",
      description: "Produtor agrícola",
      isSystem: 0,
    },
    {
      name: "Pecuarista",
      slug: "pecuarista",
      description: "Criador de gado e animais",
      isSystem: 0,
    },
  ];
  for (const r of ROLES) {
    await db.insert(roles).values(r).onConflictDoNothing();
  }

  // Assign all permissions to Super Admin
  console.log("Assigning permissions to Super Admin…");
  const [superAdminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.slug, "super-admin"))
    .limit(1);

  if (superAdminRole) {
    const allPerms = await db.select({ id: permissions.id }).from(permissions);
    // Clear existing and re-insert
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, superAdminRole.id));
    if (allPerms.length > 0) {
      await db.insert(rolePermissions).values(
        allPerms.map((p) => ({
          roleId: superAdminRole.id,
          permissionId: p.id,
        })),
      );
    }

    // Assign basic permissions to other roles
    const basicPermKeys = ["classifieds.create", "classifieds.comment"];
    const basicPerms = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(
        sql`${permissions.key} IN (${sql.join(
          basicPermKeys.map((k) => sql`${k}`),
          sql`, `,
        )})`,
      );

    for (const roleDef of ROLES) {
      if (roleDef.slug === "super-admin") continue;
      const [role] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.slug, roleDef.slug))
        .limit(1);
      if (!role) continue;
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
      if (basicPerms.length > 0) {
        await db.insert(rolePermissions).values(
          basicPerms.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        );
      }
    }

    // Set admin user to Super Admin role
    console.log("Setting admin user as Super Admin…");
    await db
      .update(users)
      .set({ roleId: superAdminRole.id, role: "super-admin" })
      .where(eq(users.email, adminEmail));
  }

  console.log("✅ Seed concluído!");
}

main().catch(console.error);
