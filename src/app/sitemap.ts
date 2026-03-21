import type { MetadataRoute } from "next";
import { db } from "@/db";
import { newsArticles, classifieds } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://agrocomm.com.br";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/cotacoes/graos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cotacoes/pecuaria`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cotacoes/chicago`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/noticias`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/classificados`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/ajuda`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/suporte`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const articles = await db
    .select({
      slug: newsArticles.slug,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .orderBy(desc(newsArticles.publishedAt))
    .limit(500);

  const newsPages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/noticias/${article.slug}`,
    lastModified: article.publishedAt
      ? new Date(`${article.publishedAt}T12:00:00`)
      : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const ads = await db
    .select({
      slug: classifieds.slug,
      updatedAt: classifieds.updatedAt,
    })
    .from(classifieds)
    .where(eq(classifieds.status, "active"))
    .orderBy(desc(classifieds.createdAt))
    .limit(500);

  const classifiedPages: MetadataRoute.Sitemap = ads.map((ad) => ({
    url: `${baseUrl}/classificados/${ad.slug}`,
    lastModified: ad.updatedAt ? new Date(ad.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...newsPages, ...classifiedPages];
}
