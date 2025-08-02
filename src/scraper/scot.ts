import * as cheerio from "cheerio";
import { Element } from "domhandler";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { prices } from "@/db/schema";
import { extractCityAndState } from "./utils";
import { convertStringToDate } from "./utils";
import { loadScotUrl, stringToNumber } from "./utils";
import { calculateVariation } from "@/lib/prices";

interface Commodity {
  id: number
  name: string
  url: string
  tr: string
  tableDate: string
}

type Price = typeof prices.$inferInsert
// const url = 'https://www.scotconsultoria.com.br/cotacoes'
const urls = {
  graos: 'https://www.scotconsultoria.com.br/cotacoes/graos/?ref=smnb',
  boi: 'https://www.scotconsultoria.com.br/cotacoes/boi-gordo/?ref=smnb',
  vaca: 'https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/?ref=smnb',
  milho: 'https://www.scotconsultoria.com.br/cotacoes/milho/?ref=smnb'
}

const commodities: Commodity[] = [
  {
    id: 1,
    name: 'boi',
    url: urls.boi,
    tr: 'div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr',
    tableDate: ''
  },
  {
    id: 2,
    name: 'vaca',
    url: urls.vaca,
    tr: '',
    tableDate: ''
  },
  {
    id: 3,
    name: 'soja',
    url: urls.graos,
    tr: '',
    tableDate: ''
  },
  {
    id: 4,
    name: 'milho',
    url: urls.milho,
    tr: '',
    tableDate: ''
  }
]

function comm(name: string): Commodity | undefined {
  return commodities.find(commodity => commodity.name === name)
}

// async function addData(data: Price[]) {
//   await db.insert(prices).values(data).onConflictDoNothing()
// }

async function addData(data: Price[]) {
  // Calcular variação para cada item antes de inserir
  for (const item of data) {
    const lastPrice = await getLastPrice(item.commodity!, item.state);
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
  const commodity = comm('boi')
  if (!commodity) return

  const body = await loadScotUrl(commodity.url)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr')
  const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)')
    .text()
    .replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)

  tr.each((idx: number, el: Element) => {
    if (idx > 2) {
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(1).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        data.push({
          createdAt: createdAt.toISOString(),
          price,
          city: city ? city : '-',
          state,
          commodity: 'boi',
          variation: 0 // Será calculado na função addData
        })
      }
    }
  })

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

  tr.each((idx: number, el: Element) => {
    if (idx > 2) {
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        data.push({
          createdAt: createdAt.toISOString(),
          price,
          city: city ?? '-',
          state,
          commodity: 'vaca',
          variation: 0 // Será calculado na função addData
        })
      }
    }
  })

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

  tr.each((idx: number, el: Element) => {
    if (idx > 2) {
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        data.push({
          createdAt: createdAt.toISOString(),
          price,
          city: city ?? '-',
          state,
          commodity: 'soja',
          variation: 0 // Será calculado na função addData
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
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

  tr.each((idx: number, el: Element) => {
    if (idx > 2) {
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ')
      const { state, city } = extractCityAndState(location)
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ')
      const price = stringToNumber(rawPrice)

      if (typeof price === 'number' && !isNaN(price) && state) {
        data.push({
          createdAt: createdAt.toISOString(),
          price,
          city: city ?? '-',
          state,
          commodity: 'milho',
          variation: 0 // Será calculado na função addData
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
}