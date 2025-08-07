import iconv from "iconv-lite";
import { states } from "@/config";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { cities } from "@/db/schema";


export async function loadScotUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return iconv.decode(Buffer.from(buffer), "iso-8859-1");
}

export function extractCityAndState(location: string) {
  if (!location) return { state: null, city: null };
  
  location = location.trim();
  
  // Se a string estiver vazia após trim, retornar null
  if (!location) return { state: null, city: null };
  
  // Padrão 1: "Cidade/UF" (ex: "São Paulo/SP")
  const cityStateMatch = location.match(/^(.+)\/([A-Z]{2})$/);
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2];
    return { state, city: city || null };
  }
  
  // Padrão 2: Apenas "UF" (ex: "SP")
  const stateOnlyMatch = location.match(/^([A-Z]{2})$/);
  if (stateOnlyMatch) {
    const state = stateOnlyMatch[1];
    return { state, city: null };
  }
  
  // Padrão 3: "Estado - Cidade" (ex: "São Paulo - Capital")
  const stateDashCityMatch = location.match(/^(.+)\s*-\s*(.+)$/);
  if (stateDashCityMatch) {
    const statePart = stateDashCityMatch[1].trim();
    const cityPart = stateDashCityMatch[2].trim();
    
    // Verificar se a primeira parte é um estado conhecido
    const stateFound = states.find(s => 
      s.name.toLowerCase() === statePart.toLowerCase() || 
      s.abbr.toLowerCase() === statePart.toLowerCase()
    );
    
    if (stateFound) {
      return { state: stateFound.abbr, city: cityPart };
    }
  }
  
  // Padrão 4: Procurar por nome completo do estado na string
  const stateFound = states.find(s => location.includes(s.name));
  if (stateFound) {
    const city = location
      .replace(stateFound.name, '')
      .replace(/[\/\-,]/g, '')
      .trim();
    return { 
      state: stateFound.abbr, 
      city: city || null 
    };
  }
  
  // Padrão 5: Verificar se contém sigla de estado
  for (const state of states) {
    if (location.includes(state.abbr)) {
      const city = location
        .replace(state.abbr, '')
        .replace(/[\/\-,]/g, '')
        .trim();
      return { 
        state: state.abbr, 
        city: city || null 
      };
    }
  }
  
  // Se chegou até aqui, pode ser apenas uma cidade sem estado especificado
  // Neste caso, retornamos state: null e city será a string completa
  return { state: null, city: location };
}

export function convertStringToDate(dateString: string): string {
  const dateMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) return new Date().toISOString().split('T')[0];
  
  const [_, day, month, year] = dateMatch;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Conversão correta de preço
export function stringToNumber(price: string): number {
  if (!price || typeof price !== 'string') {
    throw new Error(`Preço inválido: ${price}`);
  }
  
  // Limpar o preço
  let cleanPrice = price
    .trim()
    .replace(/R\$\s*/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '');
  
  // Se a string ficou vazia após limpeza, é inválida
  if (!cleanPrice) {
    throw new Error(`Preço vazio após limpeza: "${price}"`);
  }
  
  // Converter vírgula para ponto (formato brasileiro)
  if (cleanPrice.includes(',')) {
    cleanPrice = cleanPrice.replace('.', '').replace(',', '.');
  }
  
  const numericValue = parseFloat(cleanPrice);
  
  if (isNaN(numericValue)) {
    throw new Error(`Não foi possível converter "${price}" para número`);
  }
  
  // Retornar valor em centavos
  return Math.round(numericValue * 100);
}

// Função auxiliar para debug
export function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2).replace(".", ",");
}

// Resto das funções permanecem iguais...
export function getCurrentDateWithoutHours() {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDay = now.getUTCDate();
  const utcDateWithoutHours = new Date(Date.UTC(utcYear, utcMonth, utcDay));
  console.log(utcDateWithoutHours.toISOString().slice(0, 10));
}

export function getRandomNumber(min: number, max: number) {
  return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000 * 60;
}

export async function loadUrl(url: string): Promise<string> {
  const data = await fetch(url)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const decoder = new TextDecoder('iso-8859-1' as string)
      return decoder.decode(buffer)
    })
  return data
}

export function getCurrentDate(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const utcDate = new Date(now.getTime() - timezoneOffset);
  return utcDate;
}

export function getCurrentDateString(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const utcDate = new Date(now.getTime() - timezoneOffset);
  return utcDate.toISOString();
}

function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = date.getUTCFullYear().toString();
  return `${day}/${month}/${year}`;
}

export function convertStringToFormattedDateString(dateString: string): string {
  const regex = /(\d{2})\/(\d{2})\/(\d{4})/;
  const matches = dateString.match(regex);

  if (!matches) throw new Error(`Formato de data inválido: ${dateString}`);

  const day = parseInt(matches[1], 10);
  const month = parseInt(matches[2], 10) - 1;
  const year = parseInt(matches[3], 10);

  const date = new Date(Date.UTC(year, month, day));
  date.setUTCHours(date.getUTCHours() + 3);

  return formatDateToDDMMYYYY(date);
}

export function convertStringToFormattedDate(dateString: string): Date {
  const regex = /(\d{2})\/(\d{2})\/(\d{4})/;
  const matches = dateString.match(regex);

  if (!matches) return getCurrentDate();

  const day = parseInt(matches[1], 10);
  const month = parseInt(matches[2], 10) - 1;
  const year = parseInt(matches[3], 10);

  const date = new Date(Date.UTC(year, month, day));
  date.setUTCHours(date.getUTCHours());

  return date;
}

export function getExpiryInSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error("Formato de expiração inválido. Use '1d', '2h', '60m' ou '30s'.");

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60;
    case "h":
      return value * 60 * 60;
    case "m":
      return value * 60;
    case "s":
      return value;
    default:
      throw new Error("Unidade de expiração inválida.");
  }
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function getOrCreateCity(city: string | null, state: string): Promise<string> {
  if (!city || city === '-' || !state) return "";

  const existingCity = await db
    .select({ name: cities.name })
    .from(cities)
    .where(and(
      eq(cities.name, city),
      eq(cities.state, state)
    ))
    .get();

  if (existingCity) return existingCity.name;

  const result = await db
    .insert(cities)
    .values({ name: city, state })
    .returning({ name: cities.name })
    .get();

  return result.name;
}





















