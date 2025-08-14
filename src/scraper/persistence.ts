// src/scraper/persistence.ts
import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateVariation } from "@/lib/price";
import type { PriceData } from "./temporal-consistency";

export async function getLastPrice(commodity: string, state: string): Promise<number | null> {
  try {
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
  } catch (error) {
    console.error("Erro ao buscar último preço:", error);
    return null;
  }
}

export async function addVariationToData(data: PriceData[]): Promise<PriceData[]> {
  const dataWithVariation = [];
  
  for (const item of data) {
    const lastPrice = await getLastPrice(item.commodity, item.state);
    const variation = calculateVariation(item.price, lastPrice);
    
    dataWithVariation.push({
      ...item,
      variation
    });
  }
  
  return dataWithVariation;
}

export async function saveData(data: PriceData[], source: string): Promise<void> {
  if (data.length === 0) {
    console.log(`ℹ️ Nenhum dado para salvar (fonte: ${source})`);
    return;
  }

  try {
    console.log(`💾 Salvando ${data.length} registros (fonte: ${source})`);
    
    // Adicionar variações
    const dataWithVariation = await addVariationToData(data);
    
    // Preparar dados para inserção
    const insertData = dataWithVariation.map(item => ({
      commodity: item.commodity,
      state: item.state,
      city: item.city,
      price: item.price,
      date: item.date || new Date().toISOString().split('T')[0], // ✅ Tratar null
      variation: item.variation,
      source: item.source,
      createdAt: new Date().toISOString().split('T')[0],
    }));

    // Inserir dados (ignorar conflitos)
    await db.insert(prices).values(insertData).onConflictDoNothing();
    
    console.log(`✅ ${source}: ${data.length} registros salvos com sucesso`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar dados (fonte: ${source}):`, error);
    throw error;
  }
}

// export async function saveData(data: PriceData[], source: string): Promise<void> {
//   if (data.length === 0) {
//     console.log(`ℹ️ Nenhum dado para salvar (fonte: ${source})`);
//     return;
//   }

//   try {
//     console.log(`💾 Salvando ${data.length} registros (fonte: ${source})`);
    
//     // Adicionar variações
//     const dataWithVariation = await addVariationToData(data);
    
//     // Preparar dados para inserção
//     const insertData = dataWithVariation.map(item => ({
//       commodity: item.commodity,
//       state: item.state,
//       city: item.city,
//       price: item.price,
//       date: item.date,
//       variation: item.variation,
//       source: item.source,
//       createdAt: new Date().toISOString().split('T')[0],
//     }));

//     // Inserir dados (ignorar conflitos)
//     await db.insert(prices).values(insertData).onConflictDoNothing();
    
//     console.log(`✅ ${source}: ${data.length} registros salvos com sucesso`);
    
//   } catch (error) {
//     console.error(`❌ Erro ao salvar dados (fonte: ${source}):`, error);
//     throw error;
//   }
// }