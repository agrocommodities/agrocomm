import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commodity = searchParams.get("commodity");
    const state = searchParams.get("state");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "365");

    if (!commodity) {
      return NextResponse.json(
        { error: "Commodity é obrigatório" },
        { status: 400 }
      );
    }

    const conditions = [eq(prices.commodity, commodity)];

    if (state && state !== "all") {
      conditions.push(eq(prices.state, state));
    }

    if (startDate) {
      conditions.push(gte(prices.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(prices.date, endDate));
    }

    const historicalPrices = await db
      .select({
        id: prices.id,
        price: prices.price,
        date: prices.date,
        variation: prices.variation,
        state: prices.state,
        city: prices.city,
        commodity: prices.commodity,
      })
      .from(prices)
      .where(and(...conditions))
      .orderBy(desc(prices.date))
      .limit(limit);

    return NextResponse.json(historicalPrices);
  } catch (error) {
    console.error("Erro ao buscar histórico de preços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}