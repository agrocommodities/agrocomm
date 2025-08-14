import { scrapeBoi, scrapeVaca, scrapeMilho, scrapeSoja } from "./scot";
import { scrapeNoticiasAgricolasAuto } from "./noticias-agricolas";
import { extractReferenceDate, getExistingLocations, filterComplementaryData, validateTemporalConsistency, type PriceData } from "./temporal-consistency";
import { saveData } from "./persistence";

export async function executePrimarySource(): Promise<PriceData[]> {
  console.log("🎯 Executando scrapers primários (ScotConsultoria)");
  
  try {
    await scrapeBoi();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await scrapeVaca(); 
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await scrapeMilho();
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await scrapeSoja();
    
    console.log("✅ Scrapers primários executados com sucesso");
    return [];
    
  } catch (error) {
    console.error("❌ Erro nos scrapers primários:", error);
    throw error;
  }
}

export async function executeComplementarySource(primaryData: PriceData[]): Promise<void> {
  console.log("🤖 Executando scraper complementar AUTOMÁTICO (Notícias Agrícolas)");
  
  try {
    // Buscar dados automaticamente de TODOS os estados disponíveis
    const complementaryData = await scrapeNoticiasAgricolasAuto();
    
    if (complementaryData.length === 0) {
      console.log("ℹ️ Nenhum dado encontrado automaticamente");
      return;
    }

    const detectedStates = [...new Set(complementaryData.map(item => item.state))].sort();
    console.log(`🗺️ Estados detectados automaticamente: ${detectedStates.join(", ")}`);
    console.log(`📊 Total de cotações descobertas: ${complementaryData.length}`);

    // Extrair data de referência dos dados primários
    const referenceDate = extractReferenceDate(primaryData);
    let validData = complementaryData;
    
    if (referenceDate) {
      console.log(`📅 Filtrando por data de referência: ${referenceDate}`);
      
      const existingLocations = await getExistingLocations(referenceDate);
      console.log(`📍 Localizações já existentes: ${existingLocations.size}`);
      
      validData = filterComplementaryData(
        complementaryData,
        referenceDate,
        existingLocations
      );
    } else {
      console.log("⚠️ Usando todos os dados descobertos (sem filtro temporal)");
    }

    if (validData.length === 0) {
      console.log("ℹ️ Nenhuma cotação complementar válida após filtros");
      return;
    }

    // Validar consistência temporal
    const validation = validateTemporalConsistency(validData);
    if (!validation.isValid) {
      console.warn("⚠️ Inconsistência temporal detectada:", validation.errors);
    }

    // Salvar dados complementares
    await saveData(validData, "noticias_agricolas");
    
    // Estatísticas finais
    const finalStates = [...new Set(validData.map(item => item.state))].sort();
    const finalByState = validData.reduce((acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`🎉 Estados salvos: ${finalStates.join(", ")}`);
    console.log("📊 Cotações salvas por estado:", finalByState);
    console.log(`✅ Total: ${validData.length} cotações complementares salvas automaticamente`);
    
  } catch (error) {
    console.error("❌ Erro no scraper complementar automático:", error);
    throw error;
  }
}

export async function executeDaily(): Promise<void> {
  console.log("🚀 === Iniciando coleta AUTOMÁTICA de cotações ===");
  
  try {
    // 1. Executar scrapers primários
    const primaryData = await executePrimarySource();
    
    // Delay antes do scraper complementar
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 2. Executar scraper complementar automático
    await executeComplementarySource(primaryData);
    
    console.log("🎉 === Coleta automática concluída com sucesso ===");
    
  } catch (error) {
    console.error("💥 === Erro na execução automática ===", error);
    throw error;
  }
}