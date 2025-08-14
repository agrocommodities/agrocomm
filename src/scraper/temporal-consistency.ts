// src/scraper/temporal-consistency.ts
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { prices } from "@/db/schema";

export interface PriceData {
  commodity: string;
  state: string;
  city: string;
  price: number;
  date: string | null;
  variation: number;
  source: string;
}

export function extractReferenceDate(primaryData: PriceData[]): string | null {
  if (primaryData.length === 0) return null;
  
  // Extrair todas as datas e pegar a mais recente
  const dates = primaryData.map(item => item.date);
  const uniqueDates = [...new Set(dates)].sort().reverse();
  
  if (uniqueDates.length > 1) {
    console.warn(`⚠️ Dados primários contêm múltiplas datas: ${uniqueDates.join(', ')}`);
  }
  
  return uniqueDates[0]; // Data mais recente
}

export async function getExistingLocations(referenceDate: string): Promise<Set<string>> {
  try {
    const existingData = await db
      .select({
        state: prices.state,
        city: prices.city,
      })
      .from(prices)
      .where(eq(prices.date, referenceDate));

    const locationSet = new Set<string>();
    existingData.forEach(item => {
      const locationKey = `${item.state}-${item.city}`.toLowerCase();
      locationSet.add(locationKey);
    });

    return locationSet;
  } catch (error) {
    console.error("Erro ao buscar localizações existentes:", error);
    return new Set();
  }
}

export function filterComplementaryData(
  complementaryData: PriceData[],
  referenceDate: string,
  existingLocations: Set<string>
): PriceData[] {
  
  // 1. Filtrar apenas dados da data de referência
  const sameDateData = complementaryData.filter(item => item.date === referenceDate);
  
  if (sameDateData.length === 0) {
    console.log(`ℹ️ Nenhum dado complementar encontrado para a data ${referenceDate}`);
    return [];
  }

  console.log(`📊 Dados complementares na data ${referenceDate}: ${sameDateData.length}`);

  // 2. Filtrar apenas cidades não existentes
  const filteredData = sameDateData.filter(item => {
    const locationKey = `${item.state}-${item.city}`.toLowerCase();
    const exists = existingLocations.has(locationKey);
    
    if (exists) {
      console.log(`🔄 Cidade ${item.city}/${item.state} já existe na fonte primária`);
      return false;
    }
    
    return true;
  });

  console.log(`✅ Dados filtrados: ${filteredData.length} de ${sameDateData.length} são novos`);
  return filteredData;
}

export function validateTemporalConsistency(data: PriceData[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dates = new Set(data.map(item => item.date));
  
  if (dates.size > 1) {
    errors.push(`Inconsistência temporal detectada: ${dates.size} datas diferentes (${Array.from(dates).join(', ')})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}