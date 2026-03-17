/**
 * Migration: Remove state prefix from city slugs.
 *
 * Before: "ms-campo-grande"
 * After:  "campo-grande"
 *
 * If two cities from different states share the same base name,
 * the second one gets a suffix: "campo-grande-ms".
 *
 * Run: pnpm tsx scripts/migrate-city-slugs.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { cities, states } from "../src/db/schema";

const db = drizzle(process.env.DB_FILE_NAME!);

async function main() {
  const allCities = await db
    .select({
      id: cities.id,
      slug: cities.slug,
      name: cities.name,
      stateCode: states.code,
    })
    .from(cities)
    .innerJoin(states, eq(cities.stateId, states.id));

  const usedSlugs = new Set<string>();
  let updated = 0;

  for (const city of allCities) {
    const oldSlug = city.slug;

    // Build new slug: remove state prefix
    // Normalize city name to slug format (matching scraper's norm() logic)
    const baseSlug = city.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    let newSlug = baseSlug;

    // Handle conflicts: if slug is already taken by another city, append state code
    if (usedSlugs.has(newSlug)) {
      newSlug = `${baseSlug}-${city.stateCode.toLowerCase()}`;
    }
    usedSlugs.add(newSlug);

    if (oldSlug !== newSlug) {
      await db
        .update(cities)
        .set({ slug: newSlug })
        .where(eq(cities.id, city.id));
      console.log(`  ${oldSlug} → ${newSlug}`);
      updated++;
    }
  }

  console.log(
    `\nDone: ${updated} slugs updated out of ${allCities.length} cities.`,
  );
}

main().catch(console.error);
