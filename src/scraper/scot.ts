import * as cheerio from 'cheerio'
import { Element } from 'domhandler'
import { db } from '@/db'
import { prices } from '@/db/schema'
import { extractCityAndState } from './utils'
import { convertStringToDate } from './utils'
import { loadScotUrl, stringToNumber } from './utils'

interface Commodity {
  id: number
  name: string
  url: string
  tr: string
  tableDate: string
}

type Quote = typeof prices.$inferInsert
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

async function addData(data: Quote[]) {
  await db.insert(prices).values(data).onConflictDoNothing()
}

export async function scrapeBoi() {
  const data: Quote[] = []
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
          commodity: 'boi'
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
}

export async function scrapeVaca() {
  const data: Quote[] = []
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
          commodity: 'vaca'
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
}

export async function scrapeSoja() {
  const data: Quote[] = []
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
          commodity: 'soja'
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
}

export async function scrapeMilho() {
  const data: Quote[] = []

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
          commodity: 'milho'
        })
      }
    }
  })

  if (data.length > 0) await addData(data)
}
