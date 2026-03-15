"use server";

import { db } from "@/db";
import { newsArticles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type NewsArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  category: string;
  publishedAt: string;
};

const NEWS_SELECT = {
  id: newsArticles.id,
  title: newsArticles.title,
  slug: newsArticles.slug,
  excerpt: newsArticles.excerpt,
  imageUrl: newsArticles.imageUrl,
  sourceUrl: newsArticles.sourceUrl,
  sourceName: newsArticles.sourceName,
  category: newsArticles.category,
  publishedAt: newsArticles.publishedAt,
};

export async function getLatestNews(limit = 20): Promise<NewsArticle[]> {
  return db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt))
    .limit(limit);
}

export async function getNewsByCategory(
  category: string,
  limit = 12,
): Promise<NewsArticle[]> {
  return db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .where(eq(newsArticles.category, category))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
}
