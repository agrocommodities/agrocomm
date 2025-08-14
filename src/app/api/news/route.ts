// src/app/api/news/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const latestNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.publishedAt))
      .limit(Math.min(limit, 50)); // Máximo de 50

    return NextResponse.json(latestNews);
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar notícias" },
      { status: 500 }
    );
  }
}