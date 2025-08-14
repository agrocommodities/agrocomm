// src/scraper/orchestrator.ts
import { scrapeBoi, scrapeVaca, scrapeMilho, scrapeSoja } from './scot';
import { scrapeNoticiasAgricolas } from './noticias-agricolas';
import { 
  extractReferenceDate, 
  getExistingLocations, 
  filterComplementaryData, 
  validateTemporalConsistency,
  type PriceData 
} from './temporal-consistency';
import { saveData } from './persistence';

export async function executePrimarySource(): Promise<PriceData[]> {
  console.log('🎯 Executando scrapers primários (ScotConsultoria)');
  
  const allData: PriceData[] = [];
  
  try {
    // Executar todos os scrapers do Scot
    await scrapeBoi();
    await scrapeVaca(); 
    await scrapeMilho();
    await scrapeSoja();
    
    // Buscar dados recém inseridos para retornar
    // (aqui você pode buscar do banco se necessário, 
    // ou modificar os scrapers para retornar os dados)
    
    console.log('✅ Scrapers primários executados com sucesso');
    return allData;
    
  } catch (error) {
    console.error('❌ Erro nos scrapers primários:', error);
    throw error;
  }
}

export async function executeComplementarySource(primaryData: PriceData[]): Promise<void> {
  console.log('🔄 Executando scraper complementar (Notícias Agrícolas)');
  
  try {
    // 1. Extrair data de referência dos dados primários
    const referenceDate = extractReferenceDate(primaryData);
    if (!referenceDate) {
      // Se não temos dados primários, usar data atual
      const today = new Date().toISOString().split('T')[0];
      console.warn(`⚠️ Usando data atual como referência: ${today}`);
      console.log('ℹ️ Executando scraper complementar sem filtros temporais');
    } else {
      console.log(`📅 Data de referência extraída: ${referenceDate}`);
    }

    // 2. Buscar dados do Notícias Agrícolas
    const complementaryData = await scrapeNoticiasAgricolas();
    
    if (complementaryData.length === 0) {
      console.log('ℹ️ Nenhum dado encontrado no Notícias Agrícolas');
      return;
    }

    console.log(`📊 Dados brutos do Notícias Agrícolas: ${complementaryData.length}`);

    // 3. Se temos data de referência, filtrar dados
    let validData = complementaryData;
    
    if (referenceDate) {
      // Buscar localizações já existentes
      const existingLocations = await getExistingLocations(referenceDate);
      console.log(`📍 Localizações existentes na data ${referenceDate}: ${existingLocations.size}`);
      
      // Filtrar dados complementares
      validData = filterComplementaryData(
        complementaryData,
        referenceDate,
        existingLocations
      );
    }

    if (validData.length === 0) {
      console.log('ℹ️ Nenhuma cotação complementar válida encontrada');
      return;
    }

    // 4. Validar consistência temporal
    const validation = validateTemporalConsistency(validData);
    if (!validation.isValid) {
      console.error('❌ Inconsistência temporal detectada:', validation.errors);
      return;
    }

    // 5. Salvar dados complementares
    await saveData(validData, 'noticias_agricolas');
    
    console.log(`✅ Notícias Agrícolas: ${validData.length} cotações complementares salvas`);
    
  } catch (error) {
    console.error('❌ Erro no scraper complementar:', error);
    throw error;
  }
}

export async function executeDaily(): Promise<void> {
  console.log('🚀 === Iniciando coleta diária de cotações ===');
  
  try {
    // 1. Executar scrapers primários
    const primaryData = await executePrimarySource();
    
    // 2. Executar scraper complementar
    await executeComplementarySource(primaryData);
    
    console.log('🎉 === Coleta diária concluída com sucesso ===');
    
  } catch (error) {
    console.error('💥 === Erro na execução diária ===', error);
    throw error;
  }
}