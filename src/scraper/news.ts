import * as cheerio from 'cheerio'
// import { Element } from 'domhandler'
import { db } from '@/db'
import { news } from '@/db/schema'
// import { extractCityAndState } from './utils'
// import { convertStringToDate } from './utils'
// import { loadScotUrl, stringToNumber } from './utils'
import type { News } from "@/types"

async function scrapeNoticiasAgricolas(): Promise<News[]> {
  const news: News[] = [];
  const html = await fetch("https://www.noticiasagricolas.com.br/noticias").then(res => res.text());
  const $ = cheerio.load(html);

  $(".lista-wrapper > ul:nth-child(3) li").each((_, el) => {
    const title = $(el).find("h2").text().trim();
    const url = $(el).find("a").attr("href") || "";
    const imageUrl = $(el).find("img").attr("src") || "";

    if (title && url) {
      news.push({
        title,
        url: `https://www.noticiasagricolas.com.br${url}`,
        source: "Notícias Agrícolas",
        imageUrl
      });
    }
  });

  return news;
}

async function scrapeAgrolink(): Promise<News[]> {
  const news: News[] = [];
  const html = await fetch("https://www.agrolink.com.br/noticias").then(res => res.text());
  const $ = cheerio.load(html);
    
  $("div.content-news-main:nth-child(5)").each((_, el) => {
    const title = $(el).find("a:nth-child(1)").text().trim();
    const url = $(el).find("a").attr("href") || "";

    console.log({ title, url });

    if (title && url) {
      news.push({
        title,
        url: `https://www.agrolink.com.br${url}`,
        source: "Agrolink"
      });
    }
  });

  return news.slice(0, 5); // Limita a 5 notícias
}

async function scrapeCanalRural(): Promise<News[]> {
  const html = await fetch("https://www.canalrural.com.br/ultimas-noticias/").then(res => res.text());
  const $ = cheerio.load(html);

  const news: News[] = [];

  $(".lista-ultimas-noticias article").each((_, el) => {
    const title = $(el).find("h2").text().trim();
    const url = $(el).find("a").attr("href") || "";
    const imageUrl = $(el).find("img").attr("src") || "";

    if (title && url) {
      news.push({
        title,
        url: `https://www.canalrural.com.br${url}`,
        source: "Canal Rural",
        imageUrl
      });
    }
  });

  return news;
}

try {
  const [agricolas, agrolink, canalRural] = await Promise.all([
    scrapeNoticiasAgricolas(),
    scrapeAgrolink(),
    scrapeCanalRural()
  ]);

  // const allNews = [...agricolas, ...agrolink, ...canalRural];
  const allNews = [...agricolas];

  // Salva no banco de dados
  for (const item of allNews) {
    await db.insert(news).values({
      title: item.title,
      url: item.url,
      source: item.source,
      summary: item.summary || "",
      imageUrl: item.imageUrl || "",
      publishedAt: new Date()
    }).onConflictDoNothing();
  }

  console.log({ success: true, count: allNews.length });
} catch (error) {
  console.log(
    { error: "Erro no scraping: " + error },
    { status: 500 }
  );
}