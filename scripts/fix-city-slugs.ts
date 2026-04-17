/**
 * Migração: corrige slugs de cidades removendo prefixo do estado.
 *
 * Antes:  slug = "ms-campo-grande"  (estado duplicado na URL)
 * Depois: slug = "campo-grande"
 *
 * Deve rodar APÓS `pnpm push` (nova constraint composta) e ANTES de `pnpm seed`.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { cities, states } from "../src/db/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DB_FILE_NAME!);

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const allCities = await db
    .select({
      id: cities.id,
      name: cities.name,
      slug: cities.slug,
      stateCode: states.code,
    })
    .from(cities)
    .innerJoin(states, eq(cities.stateId, states.id));

  let updated = 0;
  let skipped = 0;

  // Track used slugs per state to handle duplicates
  const usedSlugs = new Map<string, Set<string>>();

  // Pre-populate with slugs that won't change
  for (const city of allCities) {
    const newSlug = slugify(city.name);
    if (city.slug === newSlug) {
      const key = city.stateCode;
      if (!usedSlugs.has(key)) usedSlugs.set(key, new Set());
      usedSlugs.get(key)!.add(newSlug);
    }
  }

  for (const city of allCities) {
    const baseSlug = slugify(city.name);

    if (city.slug === baseSlug) {
      skipped++;
      continue;
    }

    const key = city.stateCode;
    if (!usedSlugs.has(key)) usedSlugs.set(key, new Set());
    const stateSet = usedSlugs.get(key)!;

    let newSlug = baseSlug;
    let suffix = 2;
    while (stateSet.has(newSlug)) {
      newSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    stateSet.add(newSlug);

    await db
      .update(cities)
      .set({ slug: newSlug })
      .where(eq(cities.id, city.id));

    console.log(
      `  ${city.stateCode}/${city.name}: "${city.slug}" → "${newSlug}"`,
    );
    updated++;
  }

  console.log(
    `\nMigração concluída: ${updated} atualizadas, ${skipped} já corretas (total: ${allCities.length})`,
  );
}

main().catch((err) => {
  console.error("Erro na migração de slugs:", err);
  process.exit(1);
});
