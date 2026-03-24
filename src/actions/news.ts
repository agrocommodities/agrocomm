"use server";

import { db } from "@/db";
import { newsArticles, tags, newsArticleTags, pageViews } from "@/db/schema";
import { desc, eq, and, sql, inArray, count } from "drizzle-orm";

export type NewsArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  category: string;
  publishedAt: string;
  tags?: string[];
};

const NEWS_SELECT = {
  id: newsArticles.id,
  title: newsArticles.title,
  slug: newsArticles.slug,
  excerpt: newsArticles.excerpt,
  content: newsArticles.content,
  imageUrl: newsArticles.imageUrl,
  sourceUrl: newsArticles.sourceUrl,
  sourceName: newsArticles.sourceName,
  category: newsArticles.category,
  publishedAt: newsArticles.publishedAt,
};

async function attachTags(
  articles: Omit<NewsArticle, "tags">[],
): Promise<NewsArticle[]> {
  if (articles.length === 0) return [];

  const articleIds = articles.map((a) => a.id);
  const tagRows = await db
    .select({
      articleId: newsArticleTags.articleId,
      tagName: tags.name,
    })
    .from(newsArticleTags)
    .innerJoin(tags, eq(newsArticleTags.tagId, tags.id))
    .where(inArray(newsArticleTags.articleId, articleIds));

  const tagMap = new Map<number, string[]>();
  for (const row of tagRows) {
    const existing = tagMap.get(row.articleId) ?? [];
    existing.push(row.tagName);
    tagMap.set(row.articleId, existing);
  }

  return articles.map((a) => ({ ...a, tags: tagMap.get(a.id) ?? [] }));
}

export async function getLatestNews(limit = 20): Promise<NewsArticle[]> {
  const articles = await db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt))
    .limit(limit);
  return attachTags(articles);
}

export async function getNewsByCategory(
  category: string,
  limit = 12,
): Promise<NewsArticle[]> {
  const articles = await db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .where(eq(newsArticles.category, category))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return attachTags(articles);
}

export async function getNewsBySlug(
  slug: string,
): Promise<NewsArticle | undefined> {
  const [article] = await db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .where(eq(newsArticles.slug, slug))
    .limit(1);
  if (!article) return undefined;
  const [withTags] = await attachTags([article]);
  return withTags;
}

export async function getRelatedNews(
  currentSlug: string,
  category: string,
  limit = 4,
): Promise<NewsArticle[]> {
  const { ne } = await import("drizzle-orm");
  const articles = await db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .where(
      and(
        eq(newsArticles.category, category),
        ne(newsArticles.slug, currentSlug),
      ),
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return attachTags(articles);
}

export async function getNewsByTag(
  tagSlug: string,
  limit = 20,
): Promise<NewsArticle[]> {
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.slug, tagSlug))
    .limit(1);
  if (!tag) return [];

  const articleIds = await db
    .select({ articleId: newsArticleTags.articleId })
    .from(newsArticleTags)
    .where(eq(newsArticleTags.tagId, tag.id));

  if (articleIds.length === 0) return [];

  const articles = await db
    .select(NEWS_SELECT)
    .from(newsArticles)
    .where(
      inArray(
        newsArticles.id,
        articleIds.map((r) => r.articleId),
      ),
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return attachTags(articles);
}

export type TagCloud = { name: string; slug: string; count: number };

export async function getArticleViewCount(
  slug: string,
): Promise<{ views: number; uniqueVisitors: number }> {
  const path = `/noticias/${slug}`;
  const [result] = await db
    .select({
      views: count(),
      uniqueVisitors: sql<number>`count(distinct ${pageViews.sessionId})`.as(
        "unique_visitors",
      ),
    })
    .from(pageViews)
    .where(eq(pageViews.path, path));
  return {
    views: result?.views ?? 0,
    uniqueVisitors: result?.uniqueVisitors ?? 0,
  };
}

export async function getTagCloud(): Promise<TagCloud[]> {
  const results = await db
    .select({
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`count(${newsArticleTags.id})`,
    })
    .from(tags)
    .innerJoin(newsArticleTags, eq(tags.id, newsArticleTags.tagId))
    .groupBy(tags.id)
    .orderBy(sql`count(${newsArticleTags.id}) desc`)
    .limit(30);

  return results.map((r) => ({
    name: r.name,
    slug: r.slug,
    count: Number(r.count),
  }));
}
