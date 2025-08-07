import * as cheerio from "cheerio";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { prices } from "@/db/schema";
import { extractCityAndState, getOrCreateCity } from "./utils";
import { convertStringToDate } from "./utils";
import { loadScotUrl, stringToNumber } from "./utils";
import { calculateVariation } from "@/lib/price";

type Price = typeof prices.$inferInsert

const urls = {
  graos: 'https://www.scotconsultoria.com.br/cotacoes/graos/?ref=smnb',
  boi: 'https://www.scotconsultoria.com.br/cotacoes/boi-gordo/?ref=smnb',
  vaca: 'https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/?ref=smnb',
  milho: 'https://www.scotconsultoria.com.br/cotacoes/milho/?ref=smnb'
}

async function addData(data: Price[]) {
  // Calcular variação para cada item antes de inserir
  for (const item of data) {
    const lastPrice = await getLastPrice(item.commodity!, item.state!);
    item.variation = calculateVariation(item.price, lastPrice);
  }
  
  await db.insert(prices).values(data).onConflictDoNothing()
}

async function getLastPrice(commodity: string, state: string): Promise<number | null> {
  const result = await db
    .select({ price: prices.price })
    .from(prices)
    .where(and(
      eq(prices.commodity, commodity),
      eq(prices.state, state)
    ))
    .orderBy(sql`${prices.createdAt} DESC`)
    .limit(1);

  return result.length > 0 ? result[0].price : null;
}

export async function scrapeBoi() {
  const data: Price[] = []

  const body = await loadScotUrl(urls.boi)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr')
  const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)')
    .text()
    .replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city: cityName } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(1).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (price && state) {
        const city = await getOrCreateCity(cityName, state)

        data.push({
          commodity: "boi",
          state,
          city: city || "",
          price,
          date: createdAt.toString(),
          createdAt: createdAt.toString(),
          variation: 0 // Será calculado na função addData
        })
      }
    }
  }

  if (data.length > 0) await addData(data)
}

export async function scrapeVaca() {
  const data: Price[] = []

  const body = await loadScotUrl(urls.vaca)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(3) tbody tr')
  const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(3) thead tr th')
    .text()
    .replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city: cityName } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        const city = await getOrCreateCity(cityName, state)

        data.push({
          commodity: 'vaca',
          state,
          city,
          price,
          date: createdAt.toString(),
          createdAt: createdAt.toString(),
          variation: 0 // Será calculado na função addData
        })
      }
    }
  }

  if (data.length > 0) await addData(data)
}

export async function scrapeSoja() {
  const data: Price[] = []

  const body = await loadScotUrl(urls.graos)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr')
  const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)')
    .text()
    .replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)

  let oldState = ''

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]      
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      let { state, city: cityName } = extractCityAndState(location)
      if (!state) state = oldState 
      else if (!oldState) oldState = state
      
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        const city = await getOrCreateCity(cityName, state)

        data.push({
          commodity: 'soja',
          state,
          city,
          price,
          date: createdAt.toString(),
          createdAt: createdAt.toString(),
          variation: 0 // Será calculado na função addData
        })
      }
    }
  }

  if (data.length > 0) {
    await addData(data)
    console.log(`✅ Soja: ${data.length} preços inseridos`);
  }
}

export async function scrapeMilho() {
  const data: Price[] = []

  const body = await loadScotUrl(urls.milho)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(2) tbody tr')
  const tableDate = $(
    'div.conteudo_centro:nth-child(4) > table:nth-child(2) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)'
  )
    .text()
    .replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city: cityName } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        const city = await getOrCreateCity(cityName, state)

        if (price < 1000 || price > 500000) {
          console.warn(`Preço suspeito de milho ignorado: ${cityName}/${state} - R$ ${price/100}`);
          continue;
        }

        data.push({
          commodity: 'milho',
          state,
          city,
          price,
          date: createdAt.toString(),
          createdAt: createdAt.toString(),
          variation: 0 // Será calculado na função addData
        })
      }
    }
  }

  if (data.length > 0) await addData(data)
}