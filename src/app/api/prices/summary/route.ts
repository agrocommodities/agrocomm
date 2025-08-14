// src/app/api/prices/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Buscar resumo por commodity dos últimos dados
    const summary = await db
      .select({
        commodity: prices.commodity,
        avgPrice: sql<number>`CAST(AVG(${prices.price}) AS INTEGER)`,
        avgVariation: sql<number>`CAST(AVG(COALESCE(${prices.variation}, 0)) AS INTEGER)`,
        count: sql<number>`COUNT(*)`,
        lastUpdate: sql<string>`MAX(${prices.date})`,
      })
      .from(prices)
      .where(
        sql`${prices.date} >= (
          SELECT MAX(date) 
          FROM ${prices} p2 
          WHERE p2.commodity = ${prices.commodity}
        )`
      )
      .groupBy(prices.commodity)
      .orderBy(prices.commodity);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Erro ao buscar resumo de cotações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar resumo de cotações" },
      { status: 500 }
    );
  }
}