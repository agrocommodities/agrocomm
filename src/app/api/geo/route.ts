import { NextResponse } from "next/server";
import { db } from "@/db";
import { geoCountries, geoStates, geoCities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "countries") {
    const rows = await db
      .select({
        id: geoCountries.id,
        name: geoCountries.name,
        iso2: geoCountries.iso2,
        emoji: geoCountries.emoji,
      })
      .from(geoCountries)
      .orderBy(geoCountries.name);
    return NextResponse.json(rows);
  }

  if (type === "states") {
    const countryId = Number(searchParams.get("countryId"));
    if (!countryId) return NextResponse.json([]);
    const rows = await db
      .select({
        id: geoStates.id,
        name: geoStates.name,
        iso2: geoStates.iso2,
      })
      .from(geoStates)
      .where(eq(geoStates.countryId, countryId))
      .orderBy(geoStates.name);
    return NextResponse.json(rows);
  }

  if (type === "cities") {
    const stateId = Number(searchParams.get("stateId"));
    if (!stateId) return NextResponse.json([]);
    const rows = await db
      .select({
        id: geoCities.id,
        name: geoCities.name,
      })
      .from(geoCities)
      .where(eq(geoCities.stateId, stateId))
      .orderBy(geoCities.name);
    return NextResponse.json(rows);
  }

  return NextResponse.json(
    { error: "Invalid type parameter" },
    { status: 400 },
  );
}
