import * as cheerio from "cheerio";
import { db } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { prices, states, cities, commodities } from "@/db/schema";
import { extractCityAndState, loadScotUrl, convertStringToDate } from "./utils";
import { calculateVariation } from "@/lib/price";

const URLS = {
  soja: 'https://www.scotconsultoria.com.br/cotacoes/graos/?ref=smnb',
  milho: 'https://www.scotconsultoria.com.br/cotacoes/milho/?ref=smnb',
  boi: 'https://www.scotconsultoria.com.br/cotacoes/boi-gordo/?ref=smnb',
  vaca: 'https://www.scotconsultoria.com.br/cotacoes/vaca-gorda/?ref=smnb',
};

// CORREÇÃO PRINCIPAL: Função de conversão específica para Scot
function convertScotPrice(priceText: string): number {
  // Limpar o texto
  let cleanPrice = priceText
    .trim()
    .replace(/R\$\s*/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '');
  
  // Converter vírgula para ponto
  if (cleanPrice.includes(',')) {
    // Formato brasileiro: 122,50
    cleanPrice = cleanPrice.replace('.', '').replace(',', '.');
  }
  
  const numericValue = parseFloat(cleanPrice);
  
  if (isNaN(numericValue)) {
    throw new Error(`Não foi possível converter "${priceText}" para número`);
  }
  
  // IMPORTANTE: Os preços da Scot já vêm como valor final (ex: 122.50)
  // Converter para centavos multiplicando por 100
  return Math.round(numericValue * 100);
}

async function getOrCreateState(code: string): Promise<number> {
  let state = await db.select().from(states).where(eq(states.code, code)).get();
  
  if (!state) {
    const stateName = getStateName(code);
    state = await db.insert(states)
      .values({ code, name: stateName })
      .returning()
      .get();
  }
  
  return state.id;
}

async function getOrCreateCity(name: string | null, stateId: number): Promise<number | null> {
  if (!name || name === '-') return null;
  
  let city = await db.select().from(cities)
    .where(and(eq(cities.name, name), eq(cities.stateId, stateId)))
    .get();
  
  if (!city) {
    city = await db.insert(cities)
      .values({ name, stateId })
      .returning()
      .get();
  }
  
  return city.id;
}

async function getCommodityId(slug: string): Promise<number | null> {
  const commodity = await db.select()
    .from(commodities)
    .where(eq(commodities.slug, slug))
    .get();
  
  return commodity?.id || null;
}

async function getLastPrice(commodityId: number, stateId: number): Promise<number | null> {
  const result = await db.select({ price: prices.price })
    .from(prices)
    .where(and(
      eq(prices.commodityId, commodityId),
      eq(prices.stateId, stateId)
    ))
    .orderBy(desc(prices.date))
    .limit(1)
    .get();
  
  return result?.price || null;
}

// SOJA - Estrutura específica
export async function scrapeSoja() {
  const commodityId = await getCommodityId('soja');
  if (!commodityId) return;

  try {
    const body = await loadScotUrl(URLS.soja);
    const $ = cheerio.load(body);
    
    // Soja está na 5ª tabela, coluna 3 para preço
    const table = $('div.conteudo_centro:nth-child(4) > table:nth-child(5)');
    const dateText = table.find('thead tr th').first().text();
    const date = convertStringToDate(dateText);
    
    const rows = table.find('tbody tr');
    const data = [];
    
    for (let i = 3; i < rows.length; i++) {
      const row = $(rows[i]);
      const cells = row.find('td');
      
      if (cells.length < 3) continue;
      
      const location = cells.eq(0).text().trim();
      const priceText = cells.eq(2).text().trim(); // Coluna 3 (índice 2)
      
      const { state, city } = extractCityAndState(location);
      if (!state) continue;
      
      try {
        const price = convertScotPrice(priceText);
        
        // Validação para soja (R$ 80 a R$ 180 por saca)
        if (price < 8000 || price > 18000) {
          console.warn(`Preço suspeito de soja ignorado: ${state} - R$ ${price/100}`);
          continue;
        }
        
        const stateId = await getOrCreateState(state);
        const cityId = await getOrCreateCity(city, stateId);
        const lastPrice = await getLastPrice(commodityId, stateId);
        
        data.push({
          commodityId,
          stateId,
          cityId,
          price,
          date,
          variation: calculateVariation(price, lastPrice),
          source: 'scotconsultoria'
        });
      } catch (error) {
        console.error(`Erro ao processar soja: ${location} - ${priceText}`, error);
      }
    }
    
    if (data.length > 0) {
      await db.insert(prices).values(data).onConflictDoNothing();
      console.log(`✅ Soja: ${data.length} preços inseridos`);
    }
  } catch (error) {
    console.error('Erro ao fazer scraping de soja:', error);
  }
}

// MILHO - Estrutura específica
export async function scrapeMilho() {
  const commodityId = await getCommodityId('milho');
  if (!commodityId) return;

  try {
    const body = await loadScotUrl(URLS.milho);
    const $ = cheerio.load(body);
    
    // Milho está na 2ª tabela, coluna 3 para preço
    const table = $('div.conteudo_centro:nth-child(4) > table:nth-child(2)');
    const dateText = table.find('thead tr th').first().text();
    const date = convertStringToDate(dateText);
    
    const rows = table.find('tbody tr');
    const data = [];
    
    for (let i = 3; i < rows.length; i++) {
      const row = $(rows[i]);
      const cells = row.find('td');
      
      if (cells.length < 3) continue;
      
      const location = cells.eq(0).text().trim();
      const priceText = cells.eq(2).text().trim(); // Coluna 3 (índice 2)
      
      const { state, city } = extractCityAndState(location);
      if (!state) continue;
      
      try {
        const price = convertScotPrice(priceText);
        
        // Validação para milho (R$ 40 a R$ 120 por saca)
        if (price < 4000 || price > 12000) {
          console.warn(`Preço suspeito de milho ignorado: ${state} - R$ ${price/100}`);
          continue;
        }
        
        const stateId = await getOrCreateState(state);
        const cityId = await getOrCreateCity(city, stateId);
        const lastPrice = await getLastPrice(commodityId, stateId);
        
        data.push({
          commodityId,
          stateId,
          cityId,
          price,
          date,
          variation: calculateVariation(price, lastPrice),
          source: 'scotconsultoria'
        });
      } catch (error) {
        console.error(`Erro ao processar milho: ${location} - ${priceText}`, error);
      }
    }
    
    if (data.length > 0) {
      await db.insert(prices).values(data).onConflictDoNothing();
      console.log(`✅ Milho: ${data.length} preços inseridos`);
    }
  } catch (error) {
    console.error('Erro ao fazer scraping de milho:', error);
  }
}

// BOI - Estrutura específica
export async function scrapeBoi() {
  const commodityId = await getCommodityId('arroba-boi');
  if (!commodityId) return;

  try {
    const body = await loadScotUrl(URLS.boi);
    const $ = cheerio.load(body);
    
    // Boi está na 5ª tabela, coluna 2 para preço
    const table = $('div.conteudo_centro:nth-child(4) > table:nth-child(5)');
    const dateText = table.find('thead tr th').first().text();
    const date = convertStringToDate(dateText);
    
    const rows = table.find('tbody tr');
    const data = [];
    
    for (let i = 3; i < rows.length; i++) {
      const row = $(rows[i]);
      const cells = row.find('td');
      
      if (cells.length < 2) continue;
      
      const location = cells.eq(0).text().trim();
      const priceText = cells.eq(1).text().trim(); // Coluna 2 (índice 1)
      
      const { state, city } = extractCityAndState(location);
      if (!state) continue;
      
      try {
        const price = convertScotPrice(priceText);
        
        // Validação para boi (R$ 200 a R$ 400 por arroba)
        if (price < 20000 || price > 40000) {
          console.warn(`Preço suspeito de boi ignorado: ${state} - R$ ${price/100}`);
          continue;
        }
        
        const stateId = await getOrCreateState(state);
        const cityId = await getOrCreateCity(city, stateId);
        const lastPrice = await getLastPrice(commodityId, stateId);
        
        data.push({
          commodityId,
          stateId,
          cityId,
          price,
          date,
          variation: calculateVariation(price, lastPrice),
          source: 'scotconsultoria'
        });
      } catch (error) {
        console.error(`Erro ao processar boi: ${location} - ${priceText}`, error);
      }
    }
    
    if (data.length > 0) {
      await db.insert(prices).values(data).onConflictDoNothing();
      console.log(`✅ Boi: ${data.length} preços inseridos`);
    }
  } catch (error) {
    console.error('Erro ao fazer scraping de boi:', error);
  }
}

// VACA - Estrutura específica
export async function scrapeVaca() {
  const commodityId = await getCommodityId('arroba-vaca');
  if (!commodityId) return;

  try {
    const body = await loadScotUrl(URLS.vaca);
    const $ = cheerio.load(body);
    
    // Vaca está na 3ª tabela, coluna 3 para preço
    const table = $('div.conteudo_centro:nth-child(4) > table:nth-child(3)');
    const dateText = table.find('thead tr th').first().text();
    const date = convertStringToDate(dateText);
    
    const rows = table.find('tbody tr');
    const data = [];
    
    for (let i = 3; i < rows.length; i++) {
      const row = $(rows[i]);
      const cells = row.find('td');
      
      if (cells.length < 3) continue;
      
      const location = cells.eq(0).text().trim();
      const priceText = cells.eq(2).text().trim(); // Coluna 3 (índice 2)
      
      const { state, city } = extractCityAndState(location);
      if (!state) continue;
      
      try {
        const price = convertScotPrice(priceText);
        
        // Validação para vaca (R$ 180 a R$ 350 por arroba)
        if (price < 18000 || price > 35000) {
          console.warn(`Preço suspeito de vaca ignorado: ${state} - R$ ${price/100}`);
          continue;
        }
        
        const stateId = await getOrCreateState(state);
        const cityId = await getOrCreateCity(city, stateId);
        const lastPrice = await getLastPrice(commodityId, stateId);
        
        data.push({
          commodityId,
          stateId,
          cityId,
          price,
          date,
          variation: calculateVariation(price, lastPrice),
          source: 'scotconsultoria'
        });
      } catch (error) {
        console.error(`Erro ao processar vaca: ${location} - ${priceText}`, error);
      }
    }
    
    if (data.length > 0) {
      await db.insert(prices).values(data).onConflictDoNothing();
      console.log(`✅ Vaca: ${data.length} preços inseridos`);
    }
  } catch (error) {
    console.error('Erro ao fazer scraping de vaca:', error);
  }
}

// Helper function
function getStateName(code: string): string {
  const stateNames: Record<string, string> = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
  };
  return stateNames[code] || code;
}