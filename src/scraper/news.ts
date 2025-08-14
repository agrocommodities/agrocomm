// src/scraper/news.ts
import * as cheerio from "cheerio";
import { db } from "@/db";
import { news } from "@/db/schema";
import type { News } from "@/types";

function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ') // Substituir múltiplos espaços por um só
    .replace(/\n/g, ' ') // Substituir quebras de linha por espaços
    .trim() // Remover espaços no início e fim
    .substring(0, 200); // Limitar tamanho
}

async function scrapeNoticiasAgricolas(): Promise<News[]> {
  const news: News[] = [];
  
  try {
    const html = await fetch("https://www.noticiasagricolas.com.br/noticias").then(res => res.text());
    const $ = cheerio.load(html);

    $(".lista-wrapper > ul:nth-child(3) li").each((_, el) => {
      const rawTitle = $(el).find("h2").text();
      const title = cleanTitle(rawTitle);
      const url = $(el).find("a").attr("href") || "";
      const imageUrl = $(el).find("img").attr("src") || "";

      if (title && url && title.length > 10) { // Validar se o título tem conteúdo útil
        news.push({
          title,
          url: `https://www.noticiasagricolas.com.br${url}`,
          source: "Notícias Agrícolas",
          imageUrl
        });
      }
    });
  } catch (error) {
    console.error("Erro ao fazer scrape do Notícias Agrícolas:", error);
  }

  return news;
}

async function scrapeAgrolink(): Promise<News[]> {
  const news: News[] = [];
  
  try {
    const html = await fetch("https://www.agrolink.com.br/noticias").then(res => res.text());
    const $ = cheerio.load(html);
      
    $("div.content-news-main:nth-child(5)").each((_, el) => {
      const rawTitle = $(el).find("a:nth-child(1)").text();
      const title = cleanTitle(rawTitle);
      const url = $(el).find("a").attr("href") || "";

      if (title && url && title.length > 10) {
        news.push({
          title,
          url: `https://www.agrolink.com.br${url}`,
          source: "Agrolink"
        });
      }
    });
  } catch (error) {
    console.error("Erro ao fazer scrape do Agrolink:", error);
  }

  return news.slice(0, 5); // Limita a 5 notícias
}

async function scrapeCanalRural(): Promise<News[]> {
  const news: News[] = [];
  
  try {
    const html = await fetch("https://www.canalrural.com.br/ultimas-noticias/").then(res => res.text());
    const $ = cheerio.load(html);

    $(".lista-ultimas-noticias article").each((_, el) => {
      const rawTitle = $(el).find("h2").text();
      const title = cleanTitle(rawTitle);
      const url = $(el).find("a").attr("href") || "";
      const imageUrl = $(el).find("img").attr("src") || "";

      if (title && url && title.length > 10) {
        news.push({
          title,
          url: `https://www.canalrural.com.br${url}`,
          source: "Canal Rural",
          imageUrl
        });
      }
    });
  } catch (error) {
    console.error("Erro ao fazer scrape do Canal Rural:", error);
  }

  return news;
}

try {
  const [agricolas, agrolink, canalRural] = await Promise.all([
    scrapeNoticiasAgricolas(),
    scrapeAgrolink(),
    scrapeCanalRural()
  ]);

  const allNews = [...agricolas, ...canalRural]; // Removendo agrolink por enquanto devido ao título problemático

  console.log(`Processando ${allNews.length} notícias...`);

  // Salva no banco de dados
  let insertedCount = 0;
  for (const item of allNews) {
    try {
      await db.insert(news).values({
        title: item.title,
        url: item.url,
        source: item.source,
        summary: item.summary || "",
        imageUrl: item.imageUrl || "",
        publishedAt: new Date()
      }).onConflictDoNothing();
      insertedCount++;
    } catch (error) {
      console.error("Erro ao inserir notícia:", error, item);
    }
  }

  console.log({ success: true, count: insertedCount, total: allNews.length });
} catch (error) {
  console.error("Erro no scraping de notícias:", error);
  process.exit(1);
}