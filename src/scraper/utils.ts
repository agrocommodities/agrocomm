import iconv from "iconv-lite";
import { states } from "@/config";

// export function stringToNumber(price: string): number {
//   return parseInt(price.replace(",", ""), 10);
// }

// export function stringToNumber(price: string): number {
//   // Remove espaços e converte vírgula para ponto
//   const cleanPrice = price.trim().replace(",", ".");
//   const numericValue = parseFloat(cleanPrice);
  
//   // Converte para centavos (multiplica por 100)
//   return Math.round(numericValue * 100);
// }

export function stringToNumber(price: string): number {
  if (!price || typeof price !== 'string') {
    throw new Error(`Preço inválido: ${price}`);
  }
  
  // Log do valor original para debug
  console.log(`🔢 Convertendo preço: "${price}"`);
  
  // Remover espaços, símbolos de moeda e caracteres especiais
  let cleanPrice = price
    .trim()
    .replace(/R\$\s*/g, '') // Remove R$
    .replace(/\s+/g, '') // Remove espaços
    .replace(/[^\d,.-]/g, ''); // Mantém apenas dígitos, vírgula, ponto e hífen
  
  console.log(`🧹 Preço limpo: "${cleanPrice}"`);
  
  // Se contém vírgula, assumir formato brasileiro (123,45)
  if (cleanPrice.includes(',')) {
    // Verificar se é formato brasileiro ou americano
    const parts = cleanPrice.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Formato brasileiro: 123,45
      cleanPrice = cleanPrice.replace(',', '.');
    } else {
      // Formato americano com vírgula como separador de milhares: 1,234.56
      cleanPrice = cleanPrice.replace(/,/g, '');
    }
  }
  
  const numericValue = parseFloat(cleanPrice);
  
  if (isNaN(numericValue)) {
    throw new Error(`Não foi possível converter "${price}" para número`);
  }
  
  // Converte para centavos
  const priceInCents = Math.round(numericValue * 100);
  console.log(`💰 Resultado: ${numericValue} -> ${priceInCents} centavos`);
  
  return priceInCents;
}

// Função auxiliar para debug
export function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2).replace(".", ",");
}

export function getCurrentDateWithoutHours() {
  const now = new Date();

  // Get UTC components
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth(); // Month is 0-indexed (0 for January, 11 for December)
  const utcDay = now.getUTCDate();

  // Create a new Date object representing the UTC date at midnight
  const utcDateWithoutHours = new Date(Date.UTC(utcYear, utcMonth, utcDay));

  console.log(utcDateWithoutHours.toISOString().slice(0, 10)); // Output: YYYY-MM-DD
}

export function getRandomNumber(min: number, max: number) {
  // Math.floor(Math.random() * (600 - 60 + 1)) + 60 * 1000
  // return Math.random() * (max - min) + min;
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

export async function loadScotUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Converte de iso-8859-1 para utf-8
  return iconv.decode(Buffer.from(buffer), "iso-8859-1");
}

// export async function loadScotUrl(url: string): Promise<string> {
//   const response = await fetch(url);
//   const buffer = await response.arrayBuffer();
//   return new TextDecoder('windows-1252').decode(buffer);
// }

export function extractCityAndState(location: string) {
  if (!location) return { state: null, city: null };

  let stateFound = states.find((state) => location === state.abbr || location.includes(state.name));
  if (stateFound) return { state: stateFound.abbr, city: "-" };

  const stateAbbr = location.substring(0, 2);
  stateFound = states.find((state) => stateAbbr === state.abbr);

  if (stateFound)
    return {
      state: stateFound.abbr,
      city: location.length > 2 ? location.substring(3) : "-",
    };

  return { state: null, city: null };
}

// DATE
export function getCurrentDate(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60000; // getTimezoneOffset() retorna em minutos
  const utcDate = new Date(now.getTime() - timezoneOffset);
  // return utcDate.toISOString()
  return utcDate;
}

export function getCurrentDateString(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const timezoneOffset = now.getTimezoneOffset() * 60000; // getTimezoneOffset() retorna em minutos
  const utcDate = new Date(now.getTime() - timezoneOffset);
  return utcDate.toISOString();
}

function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Meses são 0-indexados
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

  // if (!matches) throw new Error(`Formato de data inválido: ${dateString}`)
  if (!matches) return getCurrentDate();

  const day = parseInt(matches[1], 10);
  const month = parseInt(matches[2], 10) - 1;
  const year = parseInt(matches[3], 10);

  const date = new Date(Date.UTC(year, month, day));
  date.setUTCHours(date.getUTCHours()); // date.setUTCHours(date.getUTCHours() + 3)

  return date;
}

export function convertStringToDate(dateString: string): Date {
  const dateMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!dateMatch) throw new Error("Formato de data não encontrado. Esperado padrão: DD/MM/YYYY");
  const [_, day, month, year] = dateMatch;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCHours(date.getUTCHours()); // date.setUTCHours(date.getUTCHours() + 3)
  // return new Date(Number(year), Number(month) - 1, Number(day));
  return date;
}

export function getExpiryInSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error("Formato de expiração inválido. Use '1d', '2h', '60m' ou '30s'.");

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60; // Dias para segundos
    case "h":
      return value * 60 * 60; // Horas para segundos
    case "m":
      return value * 60; // Minutos para segundos
    case "s":
      return value; // Segundos
    default:
      throw new Error("Unidade de expiração inválida.");
  }
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}