// src/app/api/prices/latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const latestPrices = await db
      .select({
        id: prices.id,
        commodity: prices.commodity,
        state: prices.state,
        city: prices.city,
        price: prices.price,
        variation: prices.variation,
        date: prices.date,
      })
      .from(prices)
      .orderBy(desc(prices.createdAt))
      .limit(Math.min(limit, 100)); // Máximo de 100

    return NextResponse.json(latestPrices);
  } catch (error) {
    console.error("Erro ao buscar cotações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cotações" },
      { status: 500 }
    );
  }
}