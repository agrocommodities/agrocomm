import iconv from "iconv-lite";
import * as cheerio from "cheerio";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { prices } from "@/db/schema";
import { extractCityAndState, stringToNumber, convertStringToDate } from "./utils";
import { calculateVariation } from "@/lib/price";

type Price = typeof prices.$inferInsert

const urls = {
  graos: 'https://www.scotconsultoria.com.br/cotacoes/graos/?ref=smnb',
  boi: 'https://www.scotconsultoria.com.br/cotacoes/boi-gordo/?ref=smnb',
  vaca: 'https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/?ref=smnb',
  milho: 'https://www.scotconsultoria.com.br/cotacoes/milho/?ref=smnb'
}

// export async function loadScotUrl(url: string): Promise<string> {
//   const response = await fetch(url);
//   const buffer = await response.arrayBuffer();
//   return iconv.decode(Buffer.from(buffer), "iso-8859-1");
// }

export async function loadScotUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');
  const buffer = await response.arrayBuffer();
  
  if (contentType?.includes('iso-8859-1')) return iconv.decode(Buffer.from(buffer), "iso-8859-1");
  
  return new TextDecoder('utf-8').decode(buffer);
}

async function addData(data: Price[]) {
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

  let currentState = '' // Variável para armazenar o estado atual

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim()
      
      let { state, city } = extractCityAndState(location)
      
      // Se não encontrou estado na linha atual, usar o estado anterior
      if (!state && currentState) {
        state = currentState
        // Se não tem estado mas tem location, tratar location como cidade
        city = location || null
      } else if (state) {
        // Se encontrou estado, atualizar o estado atual
        currentState = state
      }

      const rawPrice = $(el).children().eq(1).text().replace(/(\s+)/g, ' ').trim()
      
      // Pular se não houver preço
      if (!rawPrice) continue
      
      try {
        const price = stringToNumber(rawPrice)

        if (price && state) {
          console.log(`Boi: ${state} - ${city || 'N/A'} - R$ ${(price/100).toFixed(2)}`)
          
          data.push({
            commodity: "boi",
            state,
            city: city || "",
            price,
            date: createdAt.toString(),
            createdAt: createdAt.toString(),
            variation: 0
          })
        }
      } catch (error) {
        console.warn(`Erro ao processar preço do boi: ${location} - ${rawPrice}`, error)
      }
    }
  }

  if (data.length > 0) {
    await addData(data)
    console.log(`✅ Boi: ${data.length} preços inseridos`)
  }
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

  let currentState = '' // Variável para armazenar o estado atual

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim()
      
      // Se a linha estiver vazia ou só tiver espaços, pular
      if (!location) continue

      let { state, city } = extractCityAndState(location)
      
      // Se não encontrou estado na linha atual, usar o estado anterior
      if (!state && currentState) {
        state = currentState
        // Se não tem estado mas tem location, tratar location como cidade
        city = location || null
      } else if (state) {
        // Se encontrou estado, atualizar o estado atual
        currentState = state
      }

      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ').trim()
      
      // Pular se não houver preço
      if (!rawPrice) continue

      try {
        const price = stringToNumber(rawPrice)

        if (typeof price === 'number' && !isNaN(price) && state) {
          console.log(`Vaca: ${state} - ${city || 'N/A'} - R$ ${(price/100).toFixed(2)}`)
          
          data.push({
            commodity: 'vaca',
            state,
            city: city || "",
            price,
            date: createdAt.toString(),
            createdAt: createdAt.toString(),
            variation: 0
          })
        }
      } catch (error) {
        console.warn(`Erro ao processar preço da vaca: ${location} - ${rawPrice}`, error)
      }
    }
  }

  if (data.length > 0) {
    await addData(data)
    console.log(`✅ Vaca: ${data.length} preços inseridos`)
  }
}

export async function scrapeSoja() {
  const data: Price[] = []
  const body = await loadScotUrl(urls.graos)
  const $ = cheerio.load(body)

  const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr')
  const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)')
    .text().replace(/(\s+)/g, ' ')
  const createdAt = convertStringToDate(tableDate)
  let oldState = '' // Variável para armazenar o estado atual

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]      
      let state = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim()
      let city = $(el).children().eq(1).text().replace(/(\s+)/g, ' ').trim()
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ').trim()
      if (!rawPrice) continue
      
      if (!state && oldState) state = oldState
      else if (state) oldState = state
      if (!city) city = "N/A"      

      try {
        const price = stringToNumber(rawPrice)

        if (price && state) {
          console.log(`Soja: ${state} - ${city || 'N/A'} - R$ ${(price/100).toFixed(2)}`)
          data.push({ commodity: 'soja', state, city, price, date: createdAt.toString(), createdAt: createdAt.toString(), variation: 0 })
        }
      } catch (error) {
        console.warn(`Erro ao processar preço da soja: ${state}/${city} - ${rawPrice}`, error)
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

  let oldState = '' // Variável para armazenar o estado atual

  for (let idx = 0; idx < tr.length; idx++) {
    if (idx > 2) {
      const el = tr[idx]
      // const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim()
      let state = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim()
      let city = $(el).children().eq(1).text().replace(/(\s+)/g, ' ').trim()
      const rawPrice = $(el).children().eq(2).text().replace(/(\s+)/g, ' ').trim()
      if (!rawPrice) continue
      
      if (!state && oldState) state = oldState
      else if (state) oldState = state
      if (!city) city = "N/A"      

      try {
        const price = stringToNumber(rawPrice)

        if (typeof price === 'number' && !Number.isNaN(price) && state) {
          // Validação de preço para milho (evitar valores absurdos)
          if (price < 1000 || price > 500000) {
            console.warn(`Preço suspeito de milho ignorado: ${city}/${state} - R$ ${price/100}`);
            continue;
          }

          console.log(`Milho: ${state} - ${city || 'N/A'} - R$ ${(price/100).toFixed(2)}`)
          data.push({ commodity: 'milho', state, city, price, date: createdAt.toString(), createdAt: createdAt.toString(), variation: 0 })
        }
      } catch (error) {
        console.warn(`Erro ao processar preço do milho: ${state}/${city} - ${rawPrice}`, error)
      }
    }
  }

  if (data.length > 0) {
    await addData(data)
    console.log(`✅ Milho: ${data.length} preços inseridos`)
  }
}